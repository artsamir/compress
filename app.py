from flask import Flask, render_template, request, send_file, redirect, url_for
import os
from PIL import Image
# from rembg import remove  # Commented out to avoid import error
from docx2pdf import convert  # For Word to PDF example

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
        # Placeholder: Handle signup form (add real logic later)
        return redirect(url_for('index'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Placeholder: Handle login form (add real logic later)
        return redirect(url_for('index'))
    return render_template('login.html')

# Example tool route: Reduce image size
@app.route('/tool/reduce-image-size', methods=['GET', 'POST'])
def reduce_image_size():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            img = Image.open(filepath)
            img.thumbnail((800, 800))  # Example resize
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'reduced_' + file.filename)
            img.save(output_path)
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Reduce Image Size', form_type='image')

# Example tool route: Image to JPG
@app.route('/tool/image-to-jpg', methods=['GET', 'POST'])
def image_to_jpg():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            img = Image.open(filepath)
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'converted.jpg')
            img.convert('RGB').save(output_path, 'JPEG')
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Image to JPG', form_type='image')

# Similar routes for other image converters (PNG, WEBP, PDF) - placeholder
@app.route('/tool/image-to-png', methods=['GET', 'POST'])
def image_to_png():
    # Implement similar to above, save as PNG
    return render_template('example_tool.html', tool_name='Image to PNG', form_type='image')

@app.route('/tool/image-to-webp', methods=['GET', 'POST'])
def image_to_webp():
    # Implement similar, save as WEBP
    return render_template('example_tool.html', tool_name='Image to WEBP', form_type='image')

@app.route('/tool/image-to-pdf', methods=['GET', 'POST'])
def image_to_pdf():
    # Use Pillow to create PDF
    return render_template('example_tool.html', tool_name='Image to PDF', form_type='image')

# Image Processing examples
# Background removal route commented out to avoid import error
"""
@app.route('/tool/background-remove', methods=['GET', 'POST'])
def background_remove():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            with open(filepath, 'rb') as f:
                input_data = f.read()
            output_data = remove(input_data)
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'no_bg.png')
            with open(output_path, 'wb') as f:
                f.write(output_data)
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Background Remove', form_type='image')
"""

@app.route('/tool/passport-maker', methods=['GET', 'POST'])
def passport_maker():
    # Placeholder: Crop to passport size
    return render_template('example_tool.html', tool_name='Passport Maker', form_type='image')

@app.route('/tool/merge-images', methods=['GET', 'POST'])
def merge_images():
    # Placeholder: Upload two images and merge with Pillow
    return render_template('example_tool.html', tool_name='Merge Two Images', form_type='multi-image')

# Text Converter examples
@app.route('/tool/word-to-hashtag', methods=['GET', 'POST'])
def word_to_hashtag():
    if request.method == 'POST':
        text = request.form['text']
        hashtags = ' '.join(['#' + word for word in text.split()])
        return hashtags  # Simple example, return as text
    return render_template('example_tool.html', tool_name='Word to Hashtag', form_type='text')

@app.route('/tool/word-to-pdf', methods=['GET', 'POST'])
def word_to_pdf():
    if request.method == 'POST':
        file = request.files['file']
        if file:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)
            output_path = os.path.join(app.config['UPLOAD_FOLDER'], 'converted.pdf')
            convert(filepath, output_path)
            return send_file(output_path, as_attachment=True)
    return render_template('example_tool.html', tool_name='Word to PDF', form_type='file')

# Placeholders for other text converters (excel, ppt to pdf) - similar, but need additional libs
@app.route('/tool/excel-to-pdf', methods=['GET', 'POST'])
def excel_to_pdf():
    return render_template('example_tool.html', tool_name='Excel to PDF', form_type='file')

@app.route('/tool/powerpoint-to-pdf', methods=['GET', 'POST'])
def powerpoint_to_pdf():
    return render_template('example_tool.html', tool_name='PowerPoint to PDF', form_type='file')

# Builder tools - placeholders (would need form inputs and template generation)
@app.route('/tool/resume-maker', methods=['GET', 'POST'])
def resume_maker():
    return render_template('example_tool.html', tool_name='Resume Maker', form_type='form')

@app.route('/tool/project-front-page-maker', methods=['GET', 'POST'])
def project_front_page_maker():
    return render_template('example_tool.html', tool_name='Project Front Page Maker', form_type='form')

@app.route('/tool/id-card-maker', methods=['GET', 'POST'])
def id_card_maker():
    return render_template('example_tool.html', tool_name='ID Card Maker', form_type='form')

@app.route('/tool/certificate-maker', methods=['GET', 'POST'])
def certificate_maker():
    return render_template('example_tool.html', tool_name='Certificate Maker', form_type='form')

# Other tools - placeholders (template generation)
@app.route('/tool/email-templates', methods=['GET', 'POST'])
def email_templates():
    return render_template('example_tool.html', tool_name='Email Templates', form_type='select')

@app.route('/tool/application-letter-template', methods=['GET', 'POST'])
def application_letter_template():
    return render_template('example_tool.html', tool_name='Application Letter Template', form_type='select')

if __name__ == '__main__':
    app.run(debug=True)