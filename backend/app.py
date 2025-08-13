import os
import sqlite3
from flask import Flask, request, render_template, redirect, jsonify, session, url_for,flash
import google.generativeai as genai
from dotenv import load_dotenv
from db import get_db, close_connection, init_db, create_and_assign_mascota
from auth import login_required, hash_password, check_password

app = Flask(__name__)
app.secret_key = 'your-very-strong-secret-key'  # ¡Cambia esto por una clave secreta segura!

# Configura las funciones de la base de datos
app.teardown_appcontext(close_connection)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed_password = hash_password(password)

        db = get_db()
        try:
            db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                (username, email, hashed_password)
            )
            db.commit()
            user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
            create_and_assign_mascota(user['id'])
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            return "Username or email already exists."
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        db = get_db()
        user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

        if user and check_password(user['password'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('asistente'))
        else:            
            return render_template('login.html')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/asistente')
@login_required
def asistente():
    return render_template('asistente.html', username=session.get('username'))

@app.route('/button-click', methods=['POST'])
@login_required
def button_click():
    data = request.get_json()
    message = data.get('message', '')
    if not message:
        return "Empty message", 400
    db = get_db()
    db.execute("INSERT INTO messages (content, user_id) VALUES (?, ?)", (message, session['user_id']))
    db.commit()
    return "Message saved!"

@app.route('/messages')
@login_required
def messages():
    db = get_db()
    rows = db.execute("SELECT * FROM messages WHERE user_id = ? ORDER BY id DESC", (session['user_id'],)).fetchall()
    return jsonify({'messages': [dict(row) for row in rows]})

@app.route('/complete-task/<int:message_id>', methods=['POST'])
@login_required
def complete_task(message_id):
    db = get_db()
    db.execute("UPDATE messages SET completed = 1 WHERE id = ? AND user_id = ?", (message_id, session['user_id']))
    db.execute("""
        UPDATE mascotas
        SET vidas = vidas + 1
        WHERE id IN (
            SELECT mascota_id FROM user_mascotas WHERE user_id = ?
        )
    """, (session['user_id'],))
    db.commit()
    return "Task marked completed and pet vidas incremented!"

@app.route('/get_vidas')
@login_required
def get_vidas():
    db = get_db()
    mascota = db.execute("""
        SELECT m.vidas FROM mascotas m
        JOIN user_mascotas um ON m.id = um.mascota_id
        WHERE um.user_id = ?
    """, (session['user_id'],)).fetchone()
    vidas = mascota['vidas'] if mascota else 0
    return jsonify({'vidas': vidas})

@app.route('/delete-completed-tasks', methods=['POST'])
@login_required
def delete_completed_tasks():
    db = get_db()
    db.execute("DELETE FROM messages WHERE user_id = ? AND completed = 1", (session['user_id'],))
    db.execute("""
        UPDATE mascotas
        SET vidas = 0
        WHERE id IN (
            SELECT mascota_id FROM user_mascotas WHERE user_id = ?
        )
    """, (session['user_id'],))
    db.commit()
    return "Completed tasks deleted and hearts reset!"

@app.route('/delete-task/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    try:
        db = get_db()
        db.execute("DELETE FROM messages WHERE id = ?", (task_id,))
        db.commit()
        return '', 204
    except Exception as e:
        print(f"Error deleting task: {e}")
        return 'Error deleting task', 500

@app.route('/edit-task/<int:task_id>', methods=['POST'])
@login_required
def edit_task(task_id):
    try:
        data = request.get_json()
        new_content = data.get('content', '').strip()
        if not new_content:
            return 'Content cannot be empty', 400
        db = get_db()
        cursor = db.execute("UPDATE messages SET content = ? WHERE id = ?", (new_content, task_id))
        db.commit()
        if cursor.rowcount == 0:
            return 'Task not found', 404
        return '', 204
    except Exception as e:
        print(f"Error editing task: {e}")
        return 'Error editing task', 500
    

# IMPLEMENTACION DE API DE GEMINI

load_dotenv()

try:
    # Configuramos la API de Google usando la clave guardada
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No se encontró la GEMINI_API_KEY en el archivo .env")
    genai.configure(api_key=api_key)
except ValueError as e:
    # Manejo de error si la API Key no está configurada
    print(f"Error de configuración: {e}")
    # En una aplicación real, podrías querer manejar esto de forma más robusta
    exit()


@app.route('/get-motivational-message')
def get_motivational_message():
    """
    Esta es nuestra ruta de API. El frontend la llamará para obtener un mensaje.
    Actúa como un intermediario seguro para la API de Gemini.
    """
    try:
        # Seleccionamos el modelo de Gemini que queremos usar
        model = genai.GenerativeModel('gemini-1.5-flash-latest') 

        # Creamos el prompt (la instrucción) para la IA
        prompt = "Dame una frase motivacional corta e inspiradora en español, de no más de 20 palabras."

        # Generamos el contenido a partir del prompt
        response = model.generate_content(prompt)

        # Devolvemos el texto generado en formato JSON
        # El .text extrae el contenido de la respuesta de la IA
        return jsonify({'message': response.text.strip()})

    except Exception as e:
        # Si algo sale mal con la API de Gemini, devolvemos un error
        print(f"Error al llamar a la API de Gemini: {e}")
        return jsonify({'error': 'No se pudo obtener un mensaje en este momento. Inténtalo de nuevo.'}), 500


if __name__ == '__main__':
    init_db(app)
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)