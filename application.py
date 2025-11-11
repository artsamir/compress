from flask import Flask, render_template, request, send_file, redirect, url_for, jsonify
import os
from PIL import Image
from rembg import remove
from docx2pdf import convert
import io
import base64
# from models import db
# from auth import auth_bp
from blueprints.image_to_jpg_api import bp as image_to_jpg_api_bp
from blueprints.image_convert_api import bp as image_convert_bp

# Create the single Flask application instance
application = Flask(__name__)
application.config['UPLOAD_FOLDER'] = '/tmp/uploads/'  # Safer in EB
application.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit
os.makedirs(application.config['UPLOAD_FOLDER'], exist_ok=True)

# Register blueprints AFTER creating `application`
application.register_blueprint(image_to_jpg_api_bp)
application.register_blueprint(image_convert_bp)

# ---------------- Force HTTPS ----------------
@application.before_request
def enforce_https():
    if os.environ.get("RAILWAY_ENV") == "production":
        if request.headers.get("X-Forwarded-Proto", "http") != "https":
            url = request.url.replace("http://", "https://", 1)
            return redirect(url, code=301)
# --------------------------------------------

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
@application.route('/tool/reduce-image-size')
def reduce_image_size():
    return render_template('reduce_image_size.html')

@application.route('/api/reduce-images', methods=['POST'])
def api_reduce_images():
    try:
        files = request.files.getlist('files[]')
        width = request.form.get('width', type=int)
        height = request.form.get('height', type=int)
        preset_size = request.form.get('preset_size')
        max_file_size = request.form.get('max_file_size', type=int)  # in KB
        
        if not files:
            return jsonify({'error': 'No files uploaded'}), 400
        
        results = []
        
        for file in files:
            if file and file.filename:
                # Save original file
                original_filename = file.filename
                filepath = os.path.join(application.config['UPLOAD_FOLDER'], original_filename)
                file.save(filepath)
                
                # Open and process image
                img = Image.open(filepath)
                original_size = os.path.getsize(filepath)
                
                # Determine target dimensions
                if preset_size:
                    preset_dimensions = {
                        '1024x768': (1024, 768),
                        '800x800': (800, 800),
                        '800x600': (800, 600),
                        '640x480': (640, 480),
                        '350x270': (350, 270)
                    }
                    target_width, target_height = preset_dimensions.get(preset_size, (800, 800))
                else:
                    target_width = width or img.width
                    target_height = height or img.height
                
                # Resize image
                if img.width != target_width or img.height != target_height:
                    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                # Generate output filename
                name, ext = os.path.splitext(original_filename)
                output_filename = f"reduced_{name}{ext}"
                output_path = os.path.join(application.config['UPLOAD_FOLDER'], output_filename)
                
                # Save with quality adjustment if file size constraint is specified
                quality = 95
                if max_file_size:
                    while quality > 10:
                        img.save(output_path, quality=quality, optimize=True)
                        if os.path.getsize(output_path) <= max_file_size * 1024:
                            break
                        quality -= 5
                else:
                    img.save(output_path, quality=quality, optimize=True)
                
                # Get final file info
                final_size = os.path.getsize(output_path)
                final_img = Image.open(output_path)
                
                results.append({
                    'original_filename': original_filename,
                    'output_filename': output_filename,
                    'original_size': original_size,
                    'final_size': final_size,
                    'original_dimensions': f"{img.width}x{img.height}" if 'img' in locals() else "N/A",
                    'final_dimensions': f"{final_img.width}x{final_img.height}",
                    'download_url': f'/download/{output_filename}'
                })
                
                # Clean up original file
                os.remove(filepath)
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@application.route('/download/<filename>')
def download_file(filename):
    filepath = os.path.join(application.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return "File not found", 404

@application.route('/api/download-all')
def download_all():
    import zipfile
    import tempfile
    
    try:
        # Get all reduced files
        reduced_files = [f for f in os.listdir(application.config['UPLOAD_FOLDER']) if f.startswith('reduced_')]
        
        if not reduced_files:
            return "No files to download", 404
        
        # Create a temporary zip file
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        
        with zipfile.ZipFile(temp_zip, 'w') as zipf:
            for filename in reduced_files:
                filepath = os.path.join(application.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(filepath):
                    zipf.write(filepath, filename)
        
        temp_zip.close()
        return send_file(temp_zip.name, as_attachment=True, download_name='reduced_images.zip')
    
    except Exception as e:
        return f"Error creating zip: {str(e)}", 500

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
    return render_template('image_to_jpg.html', tool_name='Image to JPG', form_type='image')

@application.route('/tool/image-to-png')
def tool_image_to_png():
    return render_template('image_to_png.html')

@application.route('/tool/image-to-webp')
def tool_image_to_webp():
    return render_template('image_to_webp.html')

@application.route('/tool/image-to-pdf')
def tool_image_to_pdf():
    return render_template('image_to_pdf.html')



@application.route('/tool/background-remove', methods=['GET', 'POST'])
def background_remove():
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            print("Error: No file provided")
            return jsonify({'error': 'No file provided'}), 400

        try:
            file_bytes = file.read()
            if len(file_bytes) == 0:
                print("Error: Empty file")
                return jsonify({'error': 'Empty file'}), 400

            print("Processing image with rembg...")
            input_img = Image.open(io.BytesIO(file_bytes)).convert("RGBA")
            print("Input image mode:", input_img.mode, "Size:", input_img.size)

            output_img = remove(input_img)
            print("Output image mode:", output_img.mode, "Size:", output_img.size)

            # Save for debugging
            debug_path = os.path.join(application.config['UPLOAD_FOLDER'], 'debug_output.png')
            output_img.save(debug_path, format='PNG')
            print(f"Saved debug image to {debug_path}")

            buf = io.BytesIO()
            output_img.save(buf, format='PNG')
            processed_bytes = buf.getvalue()

            original_buf = io.BytesIO()
            input_img.save(original_buf, format='PNG')
            original_bytes = original_buf.getvalue()

            original_base64 = base64.b64encode(original_bytes).decode('utf-8')
            processed_base64 = base64.b64encode(processed_bytes).decode('utf-8')

            print("Returning JSON response with processed image")
            return jsonify({
                'original': f'data:image/png;base64,{original_base64}',
                'processed': f'data:image/png;base64,{processed_base64}'
            })

        except Exception as e:
            print("Background removal error:", str(e))
            return jsonify({'error': str(e)}), 500

    return render_template('background_remove.html', tool_name='Background Remove')


@application.route('/tool/passport-maker', methods=['GET', 'POST'])
def passport_maker():
    return render_template('example_tool.html', tool_name='Passport Maker', form_type='image')



@application.route('/tool/merge-images', methods=['GET', 'POST'])
def merge_images():
    return render_template('merge_images.html', tool_name='Merge Images')


@application.route('/api/merge-remove', methods=['POST'])
def api_merge_remove():
    """Remove background from uploaded image and return base64"""
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file provided'}), 400

    try:
        img = Image.open(file.stream).convert("RGBA")
        output_img = remove(img)

        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        processed_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')

        return jsonify({'processed': f"data:image/png;base64,{processed_base64}"})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

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
