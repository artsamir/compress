from flask import Blueprint, request, jsonify, current_app
from PIL import Image
import os
import io
import base64

bp = Blueprint('image_to_jpg_api', __name__)

@bp.route('/api/image-to-jpg', methods=['POST'])
def convert_to_jpg():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if not file:
        return jsonify({'error': 'Empty file'}), 400

    try:
        # Read and convert image
        img = Image.open(file.stream)
        img = img.convert('RGB')  # Convert to RGB for JPG
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=95)
        img_byte_arr.seek(0)
        
        # Convert to base64 for preview
        img_b64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        return jsonify({
            'url': f"data:image/jpeg;base64,{img_b64}",
            'pixels': f"{img.width}x{img.height}",
            'size': len(img_byte_arr.getvalue())
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500