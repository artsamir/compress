"""
User Authentication System
Login, Signup, Profile Management
"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from functools import wraps
import os

# Will be initialized in application.py
from models_api import db, User, APIKey, APIUsage

bp = Blueprint('auth', __name__, url_prefix='/auth')

def login_required(f):
    """Login required decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/signup', methods=['GET', 'POST'])
def signup():
    """Signup নতুন user এর জন্য"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            name = data.get('name', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()
            confirm_password = data.get('confirm_password', '').strip()
            company = data.get('company', '').strip()
            
            # Validation
            if not all([name, email, password, confirm_password]):
                return jsonify({'success': False, 'error': 'All fields required'}), 400
            
            if password != confirm_password:
                return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
            
            if len(password) < 6:
                return jsonify({'success': False, 'error': 'Password must be 6+ characters'}), 400
            
            # Check if email already exists
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            
            # Create new user and save to database
            user = User(
                name=name,
                email=email,
                company_name=company if company else '',
                is_active=True
            )
            user.set_password(password)  # Hashes the password
            
            # Save to database
            db.session.add(user)
            db.session.commit()
            
            # Don't auto-login, redirect to login page instead
            return jsonify({
                'success': True,
                'message': 'Signup successful! Please login with your credentials.',
                'redirect': url_for('auth.login')
            }), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return render_template('auth/signup_new.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            email = data.get('email', '').strip()
            password = data.get('password', '').strip()
            
            if not email or not password:
                return jsonify({'success': False, 'error': 'Email and password required'}), 400
            
            # Check credentials in database
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                # Password is correct
                user.last_login = datetime.utcnow()
                db.session.commit()
                
                session['user_id'] = user.id
                session['user_name'] = user.name
                session['user_email'] = user.email
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful!',
                    'redirect': url_for('auth.profile')
                }), 200
            
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    return render_template('auth/login_new.html')

@bp.route('/logout', methods=['GET'])
def logout():
    """Logout"""
    session.clear()
    return redirect(url_for('auth.login'))

@bp.route('/profile', methods=['GET'])
@login_required
def profile():
    """User profile page"""
    user_id = session.get('user_id')
    
    # Load user data from database
    user = User.query.get(user_id)
    
    if not user:
        session.clear()
        return redirect(url_for('auth.login'))
    
    # Get user's API keys
    api_keys = APIKey.query.filter_by(user_id=user_id).all()
    
    user_data = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'company': user.company_name or 'Not provided',
        'website': user.website or 'Not provided',
        'created_at': user.created_at.isoformat() if user.created_at else '',
        'last_login': user.last_login.isoformat() if user.last_login else 'Never',
        'api_keys_count': len(api_keys)
    }
    
    return render_template('auth/profile.html', user=user_data)

@bp.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    """Update profile information"""
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        name = data.get('name', '').strip()
        company = data.get('company', '').strip()
        website = data.get('website', '').strip()
        
        # Get user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Update user information
        if name:
            user.name = name
            session['user_name'] = name
        if company:
            user.company_name = company
        if website:
            user.website = website
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully!'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/password/change', methods=['POST'])
@login_required
def change_password():
    """Change password"""
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')
        
        # Validation
        if new_password != confirm_password:
            return jsonify({'success': False, 'error': 'New passwords do not match'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'error': 'Password must be 6+ characters'}), 400
        
        # Get user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Verify current password
        if not user.check_password(current_password):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401
        
        # Set new password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully!'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api-keys', methods=['GET'])
@login_required
def list_api_keys():
    """User এর সব API keys list করো"""
    user_id = session.get('user_id')
    
    # Get API keys from database
    api_keys = APIKey.query.filter_by(user_id=user_id).all()
    
    keys_data = []
    for key in api_keys:
        keys_data.append({
            'id': key.id,
            'project_name': key.project_name,
            'key_prefix': key.key_prefix,
            'plan': key.plan,
            'is_active': key.is_active,
            'requests_per_minute': key.requests_per_minute,
            'created_at': key.created_at.isoformat() if key.created_at else '',
            'last_used': key.last_used.isoformat() if key.last_used else 'Never'
        })
    
    return jsonify({
        'success': True,
        'keys': keys_data
    }), 200

@bp.route('/api-keys/generate', methods=['POST'])
@login_required
def generate_api_key():
    """নতুন API key generate করো"""
    try:
        data = request.get_json()
        user_id = session.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        project_name = data.get('project_name', '').strip()
        description = data.get('description', '').strip()
        
        if not project_name:
            return jsonify({'success': False, 'error': 'Project name required'}), 400
        
        # Generate new key
        raw_key = APIKey.generate_key()
        key_hash = APIKey.hash_key(raw_key)
        key_prefix = raw_key[:10]
        
        # Save to database
        api_key = APIKey(
            user_id=user_id,
            key_hash=key_hash,
            key_prefix=key_prefix,
            project_name=project_name,
            email=user.email,
            plan='free',
            is_active=True,
            requests_per_minute=10
        )
        
        db.session.add(api_key)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API Key generated!',
            'key': raw_key,
            'project': project_name,
            'key_id': api_key.id,
            'warning': 'Save this key safely. You won\'t see it again!'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/api-keys/<key_id>/delete', methods=['POST'])
@login_required
def delete_api_key(key_id):
    """API key delete করো"""
    try:
        user_id = session.get('user_id')
        
        # Get API key from database
        api_key = APIKey.query.get(key_id)
        
        if not api_key:
            return jsonify({'success': False, 'error': 'API Key not found'}), 404
        
        # Verify ownership
        if api_key.user_id != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Delete from database
        db.session.delete(api_key)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'API Key deleted'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
