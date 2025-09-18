from flask import Blueprint, request, jsonify, send_file
from PIL import Image
import io, zipfile, os, base64

bp = Blueprint('image_to_jpg_api', __name__)

@bp.route('/api/image-to-jpg', methods=['POST'])
def image_to_jpg():
    file = request.files['file']
    img = Image.open(file.stream).convert('RGB')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    buf.seek(0)
    pixels = f"{img.width}x{img.height}"
    size = buf.getbuffer().nbytes
    # Return as base64 for preview
    b64 = base64.b64encode(buf.read()).decode('utf-8')
    url = f"data:image/jpeg;base64,{b64}"
    return jsonify({'url': url, 'pixels': pixels, 'size': size})

@bp.route('/api/image-to-jpg-zip', methods=['POST'])
def image_to_jpg_zip():
    data = request.get_json()
    urls = data['files']
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for idx, url in enumerate(urls):
            # decode base64 data url
            header, b64data = url.split(',', 1)
            img_bytes = base64.b64decode(b64data)
            zipf.writestr(f'image_{idx+1}.jpg', img_bytes)
    zip_buf.seek(0)
    return send_file(zip_buf, mimetype='application/zip', as_attachment=True, download_name='converted_images.zip')