"""
Public Chatbot API - Simple version without database tracking for now
"""

from flask import Blueprint, request, jsonify
import requests
import os
from datetime import datetime

bp = Blueprint('public_chatbot', __name__, url_prefix='/api/public-chatbot')

OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', "http://localhost:11434/api/generate")
OLLAMA_ENABLED = os.getenv('OLLAMA_ENABLED', 'true').lower() == 'true'

KNOWLEDGE_BASE = {
    'features': 'We offer: Background removal, Image conversion (JPG/PNG/WebP/PDF), Image merging, Resizing, CSV comparison, JSON extraction, and Resume making.',
    'background': 'To remove background: Upload image → Tool processes → Download result. Works with PNG, JPG, WebP.',
    'convert': 'Convert images between JPG, PNG, WebP, and PDF formats. Upload and select desired format.',
    'free': 'Yes, all tools are completely free! No registration required.',
    'tools': 'Background remove, Image to JPG/PNG/WebP/PDF, Merge images, Resize images, CSV comparison, JSON email extractor, Resume maker.',
    'contact': 'Email us at smartsamir0205@gmail.com or use the contact form on our website.',
    'privacy': 'Your files are processed securely and not stored on our servers.',
}

SYSTEM_PROMPT = """You are a helpful assistant for CutCompress, an online image processing tool."""

@bp.route('/ask', methods=['POST'])
def ask_public():
    """Public API endpoint"""
    try:
        data = request.get_json()
        api_key = data.get('api_key', '').strip()
        user_message = data.get('message', '').strip()
        
        if not api_key:
            return jsonify({'success': False, 'error': 'API key required'}), 401
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Message required'}), 400
        
        if len(user_message) > 1000:
            return jsonify({'success': False, 'error': 'Message too long'}), 400
        
        start_time = datetime.utcnow()
        
        try:
            response_text = call_ollama(user_message)
            model_used = 'mistral'
        except:
            response_text = call_fallback(user_message)
            model_used = 'fallback'
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        return jsonify({
            'success': True,
            'response': response_text,
            'model': model_used,
            'processing_time': round(processing_time, 2)
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }
    return jsonify(status), 200

def call_ollama(user_message: str) -> str:
    """Call Ollama API"""
    payload = {
        "model": os.getenv('OLLAMA_MODEL', 'mistral'),
        "prompt": f"{SYSTEM_PROMPT}\n\nUser: {user_message}\n\nAssistant:",
        "stream": False,
        "temperature": 0.7
    }
    
    response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
    response.raise_for_status()
    result = response.json()
    return result.get('response', 'I could not generate a response.').strip()

def call_fallback(user_message: str) -> str:
    """Fallback knowledge base"""
    user_msg_lower = user_message.lower()
    
    if any(w in user_msg_lower for w in ['background', 'remove', 'bg']):
        return KNOWLEDGE_BASE['background']
    elif any(w in user_msg_lower for w in ['convert', 'format']):
        return KNOWLEDGE_BASE['convert']
    elif any(w in user_msg_lower for w in ['free', 'cost', 'price']):
        return KNOWLEDGE_BASE['free']
    elif any(w in user_msg_lower for w in ['tool', 'feature']):
        return KNOWLEDGE_BASE['tools']
    elif any(w in user_msg_lower for w in ['contact', 'support']):
        return KNOWLEDGE_BASE['contact']
    elif any(w in user_msg_lower for w in ['privacy', 'data']):
        return KNOWLEDGE_BASE['privacy']
    else:
        return f"Great question! {KNOWLEDGE_BASE['features']}"
