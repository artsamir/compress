from flask import Flask, render_template, request, send_file, redirect, url_for, jsonify
import os
from PIL import Image
from rembg import remove
from docx2pdf import convert
import io
import base64

# Create the Flask application for AWS EB
application = Flask(__name__)
application.config['UPLOAD_FOLDER'] = '/tmp/uploads/'  # Safer in EB
os.makedirs(application.config['UPLOAD_FOLDER'], exist_ok=True)

# ----------------- Basic Routes -----------------
@application.route('/')
def index():
    return render_template('index.html')

@application.route('/tools')
def tools():
    return render_template('tools.html')

@application.route('/about')
def about():
    return render_template('about.html')

@application.route('/blog')
def blog():
    return render_template('blog.html')

@application.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template('signup.html')

@application.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return redirect(url_for('index'))
    return render_template('login.html')

# ----------------- Image Tools -----------------
@application.route('/tool/reduce-image-size', methods=['GET', 'POST'])
def reduce_image_size():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            filepath = os.path.join(application.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            img = Image.open(filepath)
            img.thumbnail((800, 800))
            output_path = os.path.join(application.config['UPLOAD_FOLDER'], 'reduced_' + file.filename)
            img.save(output_path)
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Reduce Image Size', form_type='image')

@application.route('/tool/image-to-jpg', methods=['GET', 'POST'])
def image_to_jpg():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            filepath = os.path.join(application.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            img = Image.open(filepath)
            output_path = os.path.join(application.config['UPLOAD_FOLDER'], 'converted.jpg')
            img.convert('RGB').save(output_path, 'JPEG')
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Image to JPG', form_type='image')

@application.route('/tool/image-to-png', methods=['GET', 'POST'])
def image_to_png():
    return render_template('example_tool.html', tool_name='Image to PNG', form_type='image')

@application.route('/tool/image-to-webp', methods=['GET', 'POST'])
def image_to_webp():
    return render_template('example_tool.html', tool_name='Image to WEBP', form_type='image')

@application.route('/tool/image-to-pdf', methods=['GET', 'POST'])
def image_to_pdf():
    return render_template('example_tool.html', tool_name='Image to PDF', form_type='image')

@application.route('/tool/background-remove', methods=['GET', 'POST'])
def background_remove():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            original_bytes = file.read()
            processed_bytes = remove(original_bytes)
            original_base64 = base64.b64encode(original_bytes).decode('utf-8')
            processed_base64 = base64.b64encode(processed_bytes).decode('utf-8')
            return jsonify({
                'original': f'data:image/png;base64,{original_base64}',
                'processed': f'data:image/png;base64,{processed_base64}'
            })
        return jsonify({'error': 'No file provided'}), 400
    return render_template('background_remove.html', tool_name='Background Remove')

@application.route('/tool/passport-maker', methods=['GET', 'POST'])
def passport_maker():
    return render_template('example_tool.html', tool_name='Passport Maker', form_type='image')

@application.route('/tool/merge-images', methods=['GET', 'POST'])
def merge_images():
    return render_template('example_tool.html', tool_name='Merge Two Images', form_type='multi-image')

# ----------------- Text Tools -----------------
@application.route('/tool/word-to-hashtag', methods=['GET', 'POST'])
def word_to_hashtag():
    if request.method == 'POST':
        text = request.form.get('text', '')
        hashtags = ' '.join(['#' + word for word in text.split()])
        return hashtags
    return render_template('example_tool.html', tool_name='Word to Hashtag', form_type='text')

@application.route('/tool/word-to-pdf', methods=['GET', 'POST'])
def word_to_pdf():
    if request.method == 'POST':
        file = request.files.get('file')
        if file:
            filepath = os.path.join(application.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            output_path = os.path.join(application.config['UPLOAD_FOLDER'], 'converted.pdf')
            convert(filepath, output_path)
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Word to PDF', form_type='file')

@application.route('/tool/excel-to-pdf', methods=['GET', 'POST'])
def excel_to_pdf():
    return render_template('example_tool.html', tool_name='Excel to PDF', form_type='file')

@application.route('/tool/powerpoint-to-pdf', methods=['GET', 'POST'])
def powerpoint_to_pdf():
    return render_template('example_tool.html', tool_name='PowerPoint to PDF', form_type='file')

# ----------------- Builder Tools -----------------
@application.route('/tool/resume-maker', methods=['GET', 'POST'])
def resume_maker():
    return render_template('example_tool.html', tool_name='Resume Maker', form_type='form')

@application.route('/tool/project-front-page-maker', methods=['GET', 'POST'])
def project_front_page_maker():
    return render_template('example_tool.html', tool_name='Project Front Page Maker', form_type='form')

@application.route('/tool/id-card-maker', methods=['GET', 'POST'])
def id_card_maker():
    return render_template('example_tool.html', tool_name='ID Card Maker', form_type='form')

@application.route('/tool/certificate-maker', methods=['GET', 'POST'])
def certificate_maker():
    return render_template('example_tool.html', tool_name='Certificate Maker', form_type='form')

# ----------------- Other Tools -----------------
@application.route('/tool/email-templates', methods=['GET', 'POST'])
def email_templates():
    return render_template('example_tool.html', tool_name='Email Templates', form_type='select')

@application.route('/tool/application-letter-template', methods=['GET', 'POST'])
def application_letter_template():
    return render_template('example_tool.html', tool_name='Application Letter Template', form_type='select')

# ----------------- Run -----------------
if __name__ == '__main__':
    application.run(debug=True)
