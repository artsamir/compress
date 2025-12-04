from flask import Flask, render_template, request, send_file, redirect, url_for, jsonify, flash
from flask_mail import Mail, Message
import os
from dotenv import load_dotenv
from PIL import Image
from rembg import remove
from docx2pdf import convert
import io
import base64
from models_api import db, APIKey, APIUsage
# from models import db
from blueprints.auth import bp as auth_bp
from blueprints.image_to_jpg_api import bp as image_to_jpg_api_bp
from blueprints.image_convert_api import bp as image_convert_bp
from blueprints.chatbot_api import bp as chatbot_bp
from blueprints.chatbot_public_api import bp as public_chatbot_bp
from blueprints.api_dashboard import bp as api_dashboard_bp

# Load environment variables from .env file
load_dotenv()

# Create the single Flask application instance
application = Flask(__name__)

# Get absolute path for database
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chatbot_api.db')

# Secret Key Configuration (required for sessions and flash messages)
application.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Database Configuration (using absolute path)
application.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    f'sqlite:///{db_path}'
)
application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

application.config['UPLOAD_FOLDER'] = '/tmp/uploads/'  # Safer in EB
application.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit
os.makedirs(application.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Database
db.init_app(application)

# Flask-Mail Configuration for Gmail
application.config['MAIL_SERVER'] = 'smtp.gmail.com'
application.config['MAIL_PORT'] = 587
application.config['MAIL_USE_TLS'] = True
application.config['MAIL_USERNAME'] = 'smartsamir0205@gmail.com'
application.config['MAIL_PASSWORD'] = os.getenv('GMAIL_PASSWORD', '')
application.config['MAIL_DEFAULT_SENDER'] = 'smartsamir0205@gmail.com'

mail = Mail(application)

# Register blueprints AFTER creating `application`
application.register_blueprint(auth_bp)
application.register_blueprint(image_to_jpg_api_bp)
application.register_blueprint(image_convert_bp)
application.register_blueprint(chatbot_bp)
application.register_blueprint(public_chatbot_bp)
application.register_blueprint(api_dashboard_bp)

# Context processor - make session available in all templates
@application.context_processor
def inject_session():
    from flask import session
    return {'session': session}

# Create database tables
with application.app_context():
    db.create_all()

# ---------------- Force HTTPS & WWW ----------------
@application.before_request
def enforce_https_and_www():
    # Production environment checks
    if os.environ.get("RAILWAY_ENV") == "production":
        # 1. Force HTTPS
        if request.headers.get("X-Forwarded-Proto", "http") != "https":
            url = request.url.replace("http://", "https://", 1)
            return redirect(url, code=301)
        
        # 2. Force www subdomain
        host = request.host.lower()
        if host == "cutcompress.com" or host == "www.cutcompress.com:443":
            # Redirect non-www to www
            if not host.startswith("www."):
                url = request.url.replace("cutcompress.com", "www.cutcompress.com", 1)
                return redirect(url, code=301)
# -----------------------------------------------

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

@application.route('/pricing')
def pricing():
    return render_template('pricing.html')

@application.route('/terms')
def terms():
    return render_template('terms.html')

@application.route('/refund-policy')
def refund_policy():
    return render_template('refund_policy.html')

@application.route('/resume-maker')
def resume_maker():
    return render_template('resume_maker.html')

@application.route('/json-email-extractor')
def json_email_extractor():
    return render_template('json_email_extractor.html')

@application.route('/csv-comparator')
def csv_comparator():
    return render_template('csv_comparator.html')


@application.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@application.route('/contact', methods=['GET', 'POST'])
def contact():
    return render_template('contact.html')

@application.route('/send-contact', methods=['POST'])
def send_contact():
    try:
        # Get form data
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()
        subscribe = request.form.get('subscribe', 'no')
        
        # Validate required fields
        if not all([name, email, subject, message]):
            flash('Please fill in all required fields.', 'error')
            return redirect(url_for('contact'))
        
        # Create email message to yourself
        msg = Message(
            subject=f"New Contact Form: {subject}",
            recipients=['smartsamir0205@gmail.com'],
            body=f"""
You have a new message from Cutcompress contact form:

Name: {name}
Email: {email}
Phone: {phone if phone else 'Not provided'}
Subject: {subject}
Subscribe to newsletter: {'Yes' if subscribe == 'on' else 'No'}

Message:
{message}

---
This is an automated message from Cutcompress contact form.
            """,
            reply_to=email
        )
        
        # Send email
        mail.send(msg)
        
        # Optional: Send confirmation email to user
        confirmation_msg = Message(
            subject="We received your message - Cutcompress",
            recipients=[email],
            body=f"""
Hi {name},

Thank you for contacting Cutcompress! We received your message and will get back to you as soon as possible.

Your Message Details:
Subject: {subject}
Date: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

We appreciate your interest and will respond within 24-48 hours.

Best regards,
Samir Saren
Cutcompress Team
smartsamir0205@gmail.com
+91 8918103540
            """
        )
        
        mail.send(confirmation_msg)
        
        flash('Thank you! Your message has been sent successfully. We will get back to you soon.', 'success')
        return redirect(url_for('contact'))
        
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        flash(f'Error sending message. Please try again later or email us directly.', 'error')
        return redirect(url_for('contact'))

@application.route('/api-service')
def api_service():
    """API Service dashboard page - shows docs to all, generate only for logged-in"""
    return render_template('api_service.html')

@application.route('/coming-soon')
def coming_soon():
    return render_template('coming_soon.html')

@application.route('/subscribe-notify', methods=['POST'])
def subscribe_notify():
    email = request.form.get('email')
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400
    
    # TODO: Implement email subscription to database or email service
    # For now, just return success
    return jsonify({'success': True, 'message': 'Subscription received!'})

@application.route('/blog')
def blog():
    return render_template('blog.html')

@application.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        return redirect(url_for('thankyou'))
    return render_template('signup.html')

@application.route('/thankyou')
def thankyou():
    return render_template('thankyou.html')

@application.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Show error message
        error = 'Invalid email or password. Please try again.'
        return render_template('login.html', error=error)
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
        custom_target_size = request.form.get('custom_target_size', type=float)
        size_unit = request.form.get('size_unit', 'kb')
        
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
                output_filename = f"converted_{name}{ext}"
                output_path = os.path.join(application.config['UPLOAD_FOLDER'], output_filename)
                
                # Handle custom target size (force to specific size)
                if custom_target_size:
                    # Convert target size to bytes
                    if size_unit == 'mb':
                        target_size_bytes = int(custom_target_size * 1024 * 1024)
                    else:  # kb
                        target_size_bytes = int(custom_target_size * 1024)
                    
                    current_size = os.path.getsize(filepath)
                    
                    # Handle different image formats
                    is_png = ext.lower() == '.png'
                    is_jpeg = ext.lower() in ['.jpg', '.jpeg']
                    
                    if target_size_bytes > current_size:
                        # INCREASE file size - add padding or reduce compression
                        if is_png:
                            # For PNG, reduce compression and add metadata if needed
                            best_size = 0
                            best_compress_level = 9
                            
                            # Try different compression levels (9=most, 0=least)
                            for compress_level in range(9, -1, -1):
                                temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_expand_{compress_level}_{name}{ext}")
                                try:
                                    img.save(temp_path, optimize=False, compress_level=compress_level)
                                    current_test_size = os.path.getsize(temp_path)
                                    
                                    if current_test_size <= target_size_bytes and current_test_size > best_size:
                                        best_size = current_test_size
                                        best_compress_level = compress_level
                                        if os.path.exists(output_path):
                                            os.remove(output_path)
                                        os.rename(temp_path, output_path)
                                    else:
                                        os.remove(temp_path)
                                except Exception:
                                    if os.path.exists(temp_path):
                                        os.remove(temp_path)
                            
                            # If still not big enough, add padding bytes
                            if os.path.exists(output_path):
                                current_size = os.path.getsize(output_path)
                                if current_size < target_size_bytes:
                                    with open(output_path, 'ab') as f:
                                        padding_needed = target_size_bytes - current_size
                                        # Add null bytes as padding
                                        f.write(b'\x00' * padding_needed)
                            else:
                                # Fallback: save without compression and add padding
                                img.save(output_path, optimize=False, compress_level=0)
                                current_size = os.path.getsize(output_path)
                                if current_size < target_size_bytes:
                                    with open(output_path, 'ab') as f:
                                        padding_needed = target_size_bytes - current_size
                                        f.write(b'\x00' * padding_needed)
                        
                        elif is_jpeg:
                            # For JPEG, use lowest quality and add padding
                            save_img = img.convert('RGB') if img.mode in ('RGBA', 'P') else img
                            save_img.save(output_path, quality=100, optimize=False)
                            
                            current_size = os.path.getsize(output_path)
                            if current_size < target_size_bytes:
                                with open(output_path, 'ab') as f:
                                    padding_needed = target_size_bytes - current_size
                                    f.write(b'\x00' * padding_needed)
                        
                        else:
                            # For other formats, save with best quality and add padding
                            img.save(output_path, optimize=False)
                            current_size = os.path.getsize(output_path)
                            if current_size < target_size_bytes:
                                with open(output_path, 'ab') as f:
                                    padding_needed = target_size_bytes - current_size
                                    f.write(b'\x00' * padding_needed)
                    
                    else:
                        # DECREASE file size - compress aggressively
                        if is_png:
                            # For PNG, try different compression levels and resizing
                            achieved = False
                            
                            # First try compression levels
                            for compress_level in range(9, -1, -1):
                                temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_compress_{compress_level}_{name}{ext}")
                                try:
                                    img.save(temp_path, optimize=True, compress_level=compress_level)
                                    current_test_size = os.path.getsize(temp_path)
                                    
                                    if current_test_size <= target_size_bytes:
                                        if os.path.exists(output_path):
                                            os.remove(output_path)
                                        os.rename(temp_path, output_path)
                                        achieved = True
                                        break
                                    else:
                                        os.remove(temp_path)
                                except Exception:
                                    if os.path.exists(temp_path):
                                        os.remove(temp_path)
                            
                            # If compression alone isn't enough, try resizing
                            if not achieved:
                                scale_factor = 0.9
                                while scale_factor > 0.1:
                                    new_width = max(1, int(img.width * scale_factor))
                                    new_height = max(1, int(img.height * scale_factor))
                                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                                    
                                    temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_resize_{int(scale_factor*100)}_{name}{ext}")
                                    try:
                                        resized_img.save(temp_path, optimize=True, compress_level=9)
                                        current_test_size = os.path.getsize(temp_path)
                                        
                                        if current_test_size <= target_size_bytes:
                                            if os.path.exists(output_path):
                                                os.remove(output_path)
                                            os.rename(temp_path, output_path)
                                            achieved = True
                                            break
                                        else:
                                            os.remove(temp_path)
                                            scale_factor -= 0.1
                                    except Exception:
                                        if os.path.exists(temp_path):
                                            os.remove(temp_path)
                                        scale_factor -= 0.1
                            
                            # Final fallback for PNG
                            if not achieved:
                                img.save(output_path, optimize=True, compress_level=9)
                        
                        elif is_jpeg:
                            # For JPEG, use binary search with quality and resizing
                            achieved = False
                            save_img = img.convert('RGB') if img.mode in ('RGBA', 'P') else img
                            
                            # First try quality reduction
                            for quality in range(1, 101):
                                temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_quality_{quality}_{name}{ext}")
                                try:
                                    save_img.save(temp_path, quality=quality, optimize=True)
                                    current_test_size = os.path.getsize(temp_path)
                                    
                                    if current_test_size <= target_size_bytes:
                                        if os.path.exists(output_path):
                                            os.remove(output_path)
                                        os.rename(temp_path, output_path)
                                        achieved = True
                                        break
                                    else:
                                        os.remove(temp_path)
                                except Exception:
                                    if os.path.exists(temp_path):
                                        os.remove(temp_path)
                            
                            # If quality reduction isn't enough, try resizing
                            if not achieved:
                                scale_factor = 0.9
                                while scale_factor > 0.1:
                                    new_width = max(1, int(save_img.width * scale_factor))
                                    new_height = max(1, int(save_img.height * scale_factor))
                                    resized_img = save_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                                    
                                    temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_resize_{int(scale_factor*100)}_{name}{ext}")
                                    try:
                                        resized_img.save(temp_path, quality=1, optimize=True)
                                        current_test_size = os.path.getsize(temp_path)
                                        
                                        if current_test_size <= target_size_bytes:
                                            if os.path.exists(output_path):
                                                os.remove(output_path)
                                            os.rename(temp_path, output_path)
                                            achieved = True
                                            break
                                        else:
                                            os.remove(temp_path)
                                            scale_factor -= 0.1
                                    except Exception:
                                        if os.path.exists(temp_path):
                                            os.remove(temp_path)
                                        scale_factor -= 0.1
                            
                            # Final fallback for JPEG
                            if not achieved:
                                save_img.save(output_path, quality=1, optimize=True)
                        
                        else:
                            # For other formats, try quality reduction and resizing
                            achieved = False
                            
                            # Try quality if supported
                            for quality in range(1, 101):
                                temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_other_{quality}_{name}{ext}")
                                try:
                                    img.save(temp_path, quality=quality, optimize=True)
                                    current_test_size = os.path.getsize(temp_path)
                                    
                                    if current_test_size <= target_size_bytes:
                                        if os.path.exists(output_path):
                                            os.remove(output_path)
                                        os.rename(temp_path, output_path)
                                        achieved = True
                                        break
                                    else:
                                        os.remove(temp_path)
                                except Exception:
                                    if os.path.exists(temp_path):
                                        os.remove(temp_path)
                                    # Quality not supported, break and try resizing
                                    break
                            
                            # Try resizing if quality didn't work
                            if not achieved:
                                scale_factor = 0.9
                                while scale_factor > 0.1:
                                    new_width = max(1, int(img.width * scale_factor))
                                    new_height = max(1, int(img.height * scale_factor))
                                    resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                                    
                                    temp_path = os.path.join(application.config['UPLOAD_FOLDER'], f"temp_resize_other_{int(scale_factor*100)}_{name}{ext}")
                                    try:
                                        resized_img.save(temp_path, optimize=True)
                                        current_test_size = os.path.getsize(temp_path)
                                        
                                        if current_test_size <= target_size_bytes:
                                            if os.path.exists(output_path):
                                                os.remove(output_path)
                                            os.rename(temp_path, output_path)
                                            achieved = True
                                            break
                                        else:
                                            os.remove(temp_path)
                                            scale_factor -= 0.1
                                    except Exception:
                                        if os.path.exists(temp_path):
                                            os.remove(temp_path)
                                        scale_factor -= 0.1
                            
                            # Final fallback
                            if not achieved:
                                img.save(output_path, optimize=True)
                
                # Handle max file size constraint (original logic)
                elif max_file_size:
                    target_max_bytes = max_file_size * 1024
                    is_png = ext.lower() == '.png'
                    is_jpeg = ext.lower() in ['.jpg', '.jpeg']
                    
                    if is_png:
                        # For PNG, try compression levels
                        for compress_level in range(9, -1, -1):  # Start with highest compression
                            img.save(output_path, optimize=True, compress_level=compress_level)
                            if os.path.getsize(output_path) <= target_max_bytes:
                                break
                    else:
                        # For JPEG and other quality-supporting formats
                        quality = 95
                        while quality > 10:
                            try:
                                if is_jpeg:
                                    save_img = img.convert('RGB') if img.mode in ('RGBA', 'P') else img
                                    save_img.save(output_path, quality=quality, optimize=True)
                                else:
                                    img.save(output_path, quality=quality, optimize=True)
                                
                                if os.path.getsize(output_path) <= target_max_bytes:
                                    break
                                quality -= 5
                            except Exception:
                                # Fallback without quality
                                img.save(output_path, optimize=True)
                                break
                else:
                    # No size constraints - save with best quality
                    is_jpeg = ext.lower() in ['.jpg', '.jpeg']
                    try:
                        if is_jpeg:
                            save_img = img.convert('RGB') if img.mode in ('RGBA', 'P') else img
                            save_img.save(output_path, quality=95, optimize=True)
                        else:
                            img.save(output_path, optimize=True)
                    except Exception:
                        # Final fallback
                        img.save(output_path)
                
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

# --------- SEO Files ---------
@application.route('/sitemap.xml')
def sitemap():
    """Serve sitemap.xml for search engine indexing"""
    sitemap_path = os.path.join(os.path.dirname(__file__), 'sitemap.xml')
    return send_file(sitemap_path, mimetype='application/xml')

@application.route('/robots.txt')
def robots():
    """Serve robots.txt for search engine crawling instructions"""
    robots_path = os.path.join(os.path.dirname(__file__), 'robots.txt')
    return send_file(robots_path, mimetype='text/plain')

@application.route('/google3f012163ee5e721f.html')
def google_verification():
    """Serve Google verification file"""
    verification_path = os.path.join(os.path.dirname(__file__), 'google3f012163ee5e721f.html')
    return send_file(verification_path, mimetype='text/html')

# Also serve it without the html extension for some verification methods
@application.route('/google3f012163ee5e721f')
def google_verification_alt():
    """Serve Google verification file (alternative route)"""
    verification_path = os.path.join(os.path.dirname(__file__), 'google3f012163ee5e721f.html')
    return send_file(verification_path, mimetype='text/html')

@application.route('/BingSiteAuth.xml')
def bing_verification():
    """Serve Bing verification file"""
    bing_path = os.path.join(os.path.dirname(__file__), 'BingSiteAuth.xml')
    return send_file(bing_path, mimetype='application/xml')

# ----------------- Run -----------------
if __name__ == '__main__':
    application.run(debug=True)
