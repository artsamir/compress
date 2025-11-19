from flask import Blueprint, request, jsonify
from PIL import Image
import io, base64, zipfile

bp = Blueprint('image_convert_api', __name__)

def to_b64(data: bytes) -> str:
    return base64.b64encode(data).decode('utf-8')

def decode_data_url(url: str) -> bytes:
    return base64.b64decode(url.split(',', 1)[1])

def convert_image(file_storage, fmt: str, quality: int = 95):
    img = Image.open(file_storage.stream)
    size_px = (img.width, img.height)
    buf = io.BytesIO()
    if fmt.lower() == 'jpeg':
        img = img.convert('RGB')
        img.save(buf, format='JPEG', quality=quality, optimize=True)
        mime = 'image/jpeg'
    elif fmt.lower() == 'png':
        img.save(buf, format='PNG', optimize=True)
        mime = 'image/png'
    elif fmt.lower() == 'webp':
        img.save(buf, format='WEBP', quality=quality, method=6)
        mime = 'image/webp'
    elif fmt.lower() == 'pdf':
        img = img.convert('RGB')
        img.save(buf, format='PDF', resolution=300.0)
        mime = 'application/pdf'
    else:
        raise ValueError('Unsupported format')
    buf.seek(0)
    data = buf.read()
    return {
        'mime': mime,
        'pixels': f'{size_px[0]}x{size_px[1]}',
        'size': len(data),
        'data_url': f'data:{mime};base64,{to_b64(data)}'
    }

def zip_data_urls(urls, zip_name='converted.zip'):
    zb = io.BytesIO()
    with zipfile.ZipFile(zb, 'w', zipfile.ZIP_DEFLATED) as z:
        for i, u in enumerate(urls, 1):
            if u.startswith('data:image/jpeg'): ext = 'jpg'
            elif u.startswith('data:image/png'): ext = 'png'
            elif u.startswith('data:image/webp'): ext = 'webp'
            elif u.startswith('data:application/pdf'): ext = 'pdf'
            else: ext = 'bin'
            z.writestr(f'file_{i}.{ext}', decode_data_url(u))
    zb.seek(0)
    return zb.getvalue()

@bp.route('/api/image-to-jpg', methods=['POST'])
def api_to_jpg():
    f = request.files.get('file')
    if not f: return jsonify({'error':'no file'}), 400
    out = convert_image(f, 'jpeg', quality=92)
    return jsonify({'url': out['data_url'], 'pixels': out['pixels'], 'size': out['size']})

@bp.route('/api/image-to-png', methods=['POST'])
def api_to_png():
    f = request.files.get('file')
    if not f: return jsonify({'error':'no file'}), 400
    out = convert_image(f, 'png')
    return jsonify({'url': out['data_url'], 'pixels': out['pixels'], 'size': out['size']})

@bp.route('/api/image-to-webp', methods=['POST'])
def api_to_webp():
    f = request.files.get('file')
    if not f: return jsonify({'error':'no file'}), 400
    out = convert_image(f, 'webp', quality=90)
    return jsonify({'url': out['data_url'], 'pixels': out['pixels'], 'size': out['size']})

@bp.route('/api/image-to-pdf', methods=['POST'])
def api_to_pdf():
    f = request.files.get('file')
    if not f: return jsonify({'error':'no file'}), 400
    out = convert_image(f, 'pdf')
    return jsonify({'url': out['data_url'], 'pixels': out['pixels'], 'size': out['size']})

@bp.route('/api/image-to-jpg-zip', methods=['POST'])
def api_jpg_zip():
    urls = (request.get_json() or {}).get('files', [])
    data = zip_data_urls(urls, 'jpg.zip')
    return (data, 200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=converted_images.zip'
    })

@bp.route('/api/image-to-png-zip', methods=['POST'])
def api_png_zip():
    urls = (request.get_json() or {}).get('files', [])
    data = zip_data_urls(urls, 'png.zip')
    return (data, 200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=converted_images.zip'
    })

@bp.route('/api/image-to-webp-zip', methods=['POST'])
def api_webp_zip():
    urls = (request.get_json() or {}).get('files', [])
    data = zip_data_urls(urls, 'webp.zip')
    return (data, 200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=converted_images.zip'
    })

@bp.route('/api/image-to-pdf-zip', methods=['POST'])
def api_pdf_zip():
    urls = (request.get_json() or {}).get('files', [])
    data = zip_data_urls(urls, 'pdf.zip')
    return (data, 200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=converted_pdfs.zip'
    })