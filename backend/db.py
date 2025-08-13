import sqlite3
from flask import g

DATABASE = 'pengudatabase.db'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

def close_connection(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app):
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        # Crea todas las tablas si no existen
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS mascotas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image TEXT,
                mood TEXT,
                vidas INTEGER
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_mascotas (
                user_id INTEGER NOT NULL,
                mascota_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, mascota_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (mascota_id) REFERENCES mascotas(id)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                content TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        ''')
        db.commit()

def create_and_assign_mascota(user_id, mascota_name='Pengu', image='pengu.png', mood='happy', vidas=0):
    db = get_db()
    cursor = db.cursor()

    # Crea una nueva mascota para el usuario
    cursor.execute(
        "INSERT INTO mascotas (name, image, mood, vidas) VALUES (?, ?, ?, ?)",
        (mascota_name, image, mood, vidas)
    )
    db.commit()
    mascota_id = cursor.lastrowid

    # Vincula la mascota al usuario
    cursor.execute(
        "INSERT INTO user_mascotas (user_id, mascota_id) VALUES (?, ?)",
        (user_id, mascota_id)
    )
    db.commit()

    return mascota_id