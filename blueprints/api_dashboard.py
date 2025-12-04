"""
API Dashboard Blueprint - API Key Management with Database
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for
from models_api import db, APIKey, APIUsage, APIKeyRequest
from datetime import datetime, timedelta
from functools import wraps
import os
import secrets

bp = Blueprint('api_dashboard', __name__, url_prefix='/api-service')

# Simple session-based auth for dashboard
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'api_user_email' not in session:
            return redirect(url_for('api_dashboard.login'))
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/', methods=['GET'])
def api_dashboard():
    """Main API Service Page"""
    return render_template('api_dashboard.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Simple Login"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        
        # Simple password check (in production, use proper authentication)
        if email and password == os.getenv('API_DASHBOARD_PASSWORD', 'admin123'):
            session['api_user_email'] = email
            return redirect(url_for('api_dashboard.dashboard'))
        
        return render_template('api_login.html', error='Invalid credentials')
    
    return render_template('api_login.html')

@bp.route('/logout', methods=['GET'])
def logout():
    """Logout"""
    session.pop('api_user_email', None)
    return redirect(url_for('api_dashboard.api_dashboard'))

@bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    """User Dashboard - দেখো তার সব API keys এবং usage"""
    email = session.get('api_user_email')
    
    # এই email এর সব keys fetch করো
    api_keys = APIKey.query.filter_by(email=email).all()
    
    total_requests = 0
    total_errors = 0
    
    for key in api_keys:
        stats = key.get_usage_stats(hours=24)
        total_requests += stats['total_requests']
        total_errors += stats['failed']
    
    return render_template('api_dashboard_user.html', 
                         api_keys=api_keys,
                         total_requests=total_requests,
                         total_errors=total_errors)

@bp.route('/generate-key', methods=['POST'])
@login_required
def generate_api_key():
    """নতুন API key generate করো"""
    try:
        data = request.get_json()
        project_name = data.get('project_name', '').strip()
        plan = data.get('plan', 'free')
        email = session.get('api_user_email')
        
        if not project_name:
            return jsonify({'success': False, 'error': 'Project name required'}), 400
        
        # নতুন key generate করো
        raw_key = APIKey.generate_key()
        key_hash = APIKey.hash_key(raw_key)
        key_prefix = raw_key[:10]
        
        # Database এ save করো
        api_key = APIKey(
            key_hash=key_hash,
            key_prefix=key_prefix,
            project_name=project_name,
            email=email,
            plan=plan,
            requests_per_minute=10 if plan == 'free' else 100
        )
        
        db.session.add(api_key)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API Key generated successfully!',
            'key': raw_key,  # শুধুমাত্র একবার দেখাবো
            'project': project_name,
            'plan': plan,
            'warning': 'Save this key somewhere safe. You won\'t see it again!'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/keys', methods=['GET'])
@login_required
def list_keys():
    """সব API keys দেখো"""
    email = session.get('api_user_email')
    api_keys = APIKey.query.filter_by(email=email).all()
    
    keys_data = []
    for key in api_keys:
        stats = key.get_usage_stats(hours=24)
        key_info = key.to_dict()
        key_info['usage_24h'] = stats
        keys_data.append(key_info)
    
    return jsonify({'success': True, 'keys': keys_data}), 200

@bp.route('/key/<key_id>/usage', methods=['GET'])
@login_required
def get_key_usage(key_id):
    """একটি key এর usage history দেখো"""
    email = session.get('api_user_email')
    
    # Verify key belongs to user
    api_key = APIKey.query.filter_by(id=key_id, email=email).first()
    if not api_key:
        return jsonify({'success': False, 'error': 'Key not found'}), 404
    
    # Last 100 requests
    logs = APIUsage.query.filter_by(api_key_id=key_id).order_by(
        APIUsage.created_at.desc()
    ).limit(100).all()
    
    return jsonify({
        'success': True,
        'logs': [log.to_dict() for log in logs]
    }), 200

@bp.route('/key/<key_id>/stats', methods=['GET'])
@login_required
def get_key_stats(key_id):
    """API key এর detailed stats"""
    email = session.get('api_user_email')
    
    api_key = APIKey.query.filter_by(id=key_id, email=email).first()
    if not api_key:
        return jsonify({'success': False, 'error': 'Key not found'}), 404
    
    # Different time periods
    periods = {
        '24h': api_key.get_usage_stats(hours=24),
        '7d': api_key.get_usage_stats(hours=168),
        '30d': api_key.get_usage_stats(hours=720)
    }
    
    # Model usage breakdown
    logs = APIUsage.query.filter_by(api_key_id=key_id).all()
    model_usage = {}
    for log in logs:
        if log.model_used:
            model_usage[log.model_used] = model_usage.get(log.model_used, 0) + 1
    
    return jsonify({
        'success': True,
        'stats': periods,
        'model_usage': model_usage,
        'last_used': api_key.last_used.isoformat() if api_key.last_used else None
    }), 200

@bp.route('/key/<key_id>/deactivate', methods=['POST'])
@login_required
def deactivate_key(key_id):
    """API key deactivate করো"""
    email = session.get('api_user_email')
    
    api_key = APIKey.query.filter_by(id=key_id, email=email).first()
    if not api_key:
        return jsonify({'success': False, 'error': 'Key not found'}), 404
    
    api_key.is_active = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Key deactivated'}), 200

@bp.route('/key/<key_id>/delete', methods=['POST'])
@login_required
def delete_key(key_id):
    """API key delete করো"""
    email = session.get('api_user_email')
    
    api_key = APIKey.query.filter_by(id=key_id, email=email).first()
    if not api_key:
        return jsonify({'success': False, 'error': 'Key not found'}), 404
    
    db.session.delete(api_key)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Key deleted'}), 200

@bp.route('/request-key', methods=['GET', 'POST'])
def request_api_key():
    """নতুন API key এর জন্য আবেদন করো"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Check if email already exists
            existing = APIKeyRequest.query.filter_by(email=data['email']).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already requested'}), 400
            
            req = APIKeyRequest(
                name=data.get('name'),
                email=data.get('email'),
                project_name=data.get('project_name'),
                project_url=data.get('project_url'),
                use_case=data.get('use_case'),
                estimated_requests=data.get('estimated_requests', 0),
                plan=data.get('plan', 'free')
            )
            
            db.session.add(req)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Request submitted! We\'ll review and send you an API key.'
            }), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return render_template('api_request_key.html')

@bp.route('/docs', methods=['GET'])
def api_docs():
    """API Documentation"""
    return render_template('api_docs.html')

# Admin Routes (Simple)

@bp.route('/admin/requests', methods=['GET'])
def admin_requests():
    """Admin - সব API key requests দেখো"""
    password = request.args.get('pwd', '')
    
    if password != os.getenv('ADMIN_PASSWORD', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    requests_list = APIKeyRequest.query.filter_by(status='pending').all()
    return jsonify({
        'success': True,
        'requests': [req.to_dict() for req in requests_list]
    }), 200

@bp.route('/admin/approve/<req_id>', methods=['POST'])
def admin_approve(req_id):
    """Admin - API key request approve করো"""
    password = request.args.get('pwd', '')
    
    if password != os.getenv('ADMIN_PASSWORD', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        api_req = APIKeyRequest.query.get(req_id)
        if not api_req:
            return jsonify({'error': 'Request not found'}), 404
        
        # Generate API key
        raw_key = APIKey.generate_key()
        key_hash = APIKey.hash_key(raw_key)
        
        api_key = APIKey(
            key_hash=key_hash,
            key_prefix=raw_key[:10],
            project_name=api_req.project_name,
            email=api_req.email,
            plan=api_req.plan
        )
        
        api_req.status = 'approved'
        api_req.approved_at = datetime.utcnow()
        
        db.session.add(api_key)
        db.session.commit()
        
        # TODO: Send email to user with the key
        
        return jsonify({
            'success': True,
            'message': 'Key approved and generated',
            'key': raw_key
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
