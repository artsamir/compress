from flask import Blueprint, request, jsonify
import requests
import json
import os
from typing import Optional

bp = Blueprint('chatbot', __name__, url_prefix='/api/chatbot')

# Ollama API endpoint (runs locally on your Contabo server)
OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', "http://localhost:11434/api/generate")
OLLAMA_ENABLED = os.getenv('OLLAMA_ENABLED', 'true').lower() == 'true'

# Knowledge base about your website
SYSTEM_PROMPT = """You are a helpful assistant for CutCompress, an online image processing tool.
You help users with:
- Image background removal (Remove.bg-like feature)
- Image conversion (JPG, PNG, WebP, PDF)
- Image merging and resizing
- CSV comparison
- JSON email extraction
- Resume making

Be friendly and helpful. If asked about features, explain them simply.
If you don't know something, suggest they contact support at smartsamir0205@gmail.com.
Keep responses concise and under 200 words."""

# Simple knowledge base for when Ollama is not available
KNOWLEDGE_BASE = {
    'features': 'We offer: Background removal, Image conversion (JPG/PNG/WebP/PDF), Image merging, Resizing, CSV comparison, JSON extraction, and Resume making.',
    'background': 'To remove background: Upload image → Tool processes → Download result. Works with PNG, JPG, WebP.',
    'convert': 'Convert images between JPG, PNG, WebP, and PDF formats. Upload and select desired format.',
    'free': 'Yes, all tools are completely free! No registration required.',
    'tools': 'Background remove, Image to JPG/PNG/WebP/PDF, Merge images, Resize images, CSV comparison, JSON email extractor, Resume maker.',
    'contact': 'Email us at smartsamir0205@gmail.com or use the contact form on our website.',
    'privacy': 'Your files are processed securely and not stored on our servers.',
}

@bp.route('/ask', methods=['POST'])
def ask_chatbot():
    """
    Endpoint: POST /api/chatbot/ask
    Body: {"message": "user message here"}
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Try Ollama first, fall back to knowledge base
        if OLLAMA_ENABLED:
            try:
                response = call_ollama(user_message)
            except:
                response = call_fallback(user_message)
        else:
            response = call_fallback(user_message)
        
        return jsonify({
            'success': True,
            'message': user_message,
            'response': response
        })
    
    except Exception as e:
        return jsonify({
            'error': f'Error: {str(e)}',
            'success': False
        }), 500

def call_ollama(user_message: str) -> str:
    """
    Call Ollama API with the user message
    """
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
    """
    Fallback response using simple knowledge base matching
    when Ollama is not available
    """
    user_msg_lower = user_message.lower()
    
    # Simple keyword matching
    if any(word in user_msg_lower for word in ['background', 'remove', 'bg']):
        return KNOWLEDGE_BASE['background']
    elif any(word in user_msg_lower for word in ['convert', 'change', 'format']):
        return KNOWLEDGE_BASE['convert']
    elif any(word in user_msg_lower for word in ['free', 'cost', 'price', 'pay']):
        return KNOWLEDGE_BASE['free']
    elif any(word in user_msg_lower for word in ['tool', 'do', 'what', 'feature']):
        return KNOWLEDGE_BASE['tools']
    elif any(word in user_msg_lower for word in ['contact', 'support', 'help', 'email']):
        return KNOWLEDGE_BASE['contact']
    elif any(word in user_msg_lower for word in ['privacy', 'data', 'safe', 'secure']):
        return KNOWLEDGE_BASE['privacy']
    else:
        # Generic fallback
        return f"Great question about CutCompress! {KNOWLEDGE_BASE['features']} Feel free to ask anything else!"

@bp.route('/health', methods=['GET'])
def health_check():
    """Check if chatbot service is available"""
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            return jsonify({
                'status': 'online',
                'models': [m.get('name') for m in models]
            })
    except:
        pass
    
    return jsonify({'status': 'offline'}), 503
