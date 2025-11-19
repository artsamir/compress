from flask import Flask, render_template, request, send_file, redirect, url_for, jsonify
import os
from PIL import Image
# from rembg import remove  # Temporarily commented out
from docx2pdf import convert
import io
import base64
# from models import db
# from auth import auth_bp
from blueprints.image_to_jpg_api import bp as image_to_jpg_api_bp
from blueprints.image_convert_api import bp as image_convert_bp

# Create the single Flask application instance
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads/'  # Use local uploads folder for testing
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Register blueprints AFTER creating `app`
app.register_blueprint(image_to_jpg_api_bp)
app.register_blueprint(image_convert_bp)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tools')
def tools():
    return render_template('tools.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/blog')
def blog():
    return render_template('blog.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/test')
def test():
    return "Flask app is working!"

@app.route('/tool/image-to-jpg', methods=['GET', 'POST'])
def image_to_jpg():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            img = Image.open(filepath)
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'converted.jpg')
            img.convert('RGB').save(output_path, 'JPEG')
            return send_file(output_path, as_attachment=True)
    return render_template('image_to_jpg.html', tool_name='Image to JPG', form_type='image')

# ----------------- Run -----------------
if __name__ == '__main__':
    print("Starting Flask development server...")
    app.run(debug=True, host='127.0.0.1', port=5000)