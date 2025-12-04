"""
Database Models for API Management and Usage Tracking
"""

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid
import hashlib

db = SQLAlchemy()

class User(db.Model):
    """User Account Model"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic Info
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Company/Project Info
    company_name = db.Column(db.String(255))
    website = db.Column(db.String(255))
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relations
    api_keys = db.relationship('APIKey', backref='user', lazy=True, cascade='all, delete-orphan', foreign_keys='APIKey.user_id')
    
    def set_password(self, password):
        """Hash এবং password set করো"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Password verify করো"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Dictionary format এ return করো"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'company_name': self.company_name,
            'website': self.website,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class APIKey(db.Model):
    """API Key Management"""
    __tablename__ = 'api_keys'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # User সাথে সম্পর্ক
    key_hash = db.Column(db.String(255), unique=True, nullable=False)  # হ্যাশড কী
    key_prefix = db.Column(db.String(10), nullable=False)  # প্রথম ১০ চর (দেখানোর জন্য)
    
    # প্রজেক্ট তথ্য
    project_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    plan = db.Column(db.String(50), default='free')  # free/premium/enterprise
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Rate Limiting
    requests_per_minute = db.Column(db.Integer, default=10)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    
    # Relations
    usage_logs = db.relationship('APIUsage', backref='api_key', lazy=True, cascade='all, delete-orphan')
    
    @staticmethod
    def hash_key(key):
        """কী কে hash করো"""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @staticmethod
    def generate_key():
        """নতুন API key generate করো"""
        return f"cc_{uuid.uuid4().hex[:32]}"
    
    def is_valid(self):
        """চেক করো key valid আছে কিনা"""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
    
    def get_usage_stats(self, hours=24):
        """গত ২৪ ঘন্টার usage stats"""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_logs = APIUsage.query.filter(
            APIUsage.api_key_id == self.id,
            APIUsage.created_at >= cutoff
        ).all()
        
        return {
            'total_requests': len(recent_logs),
            'successful': len([l for l in recent_logs if l.status == 'success']),
            'failed': len([l for l in recent_logs if l.status == 'error']),
            'avg_processing_time': sum([l.processing_time or 0 for l in recent_logs]) / len(recent_logs) if recent_logs else 0
        }
    
    def to_dict(self):
        """API response এর জন্য dict format"""
        return {
            'id': self.id,
            'key': self.key_prefix + '...',  # শেষ ১০ চর লুকানো
            'project': self.project_name,
            'email': self.email,
            'plan': self.plan,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_used': self.last_used.isoformat() if self.last_used else None,
            'requests_per_minute': self.requests_per_minute
        }


class APIUsage(db.Model):
    """API Usage Logging এবং Analytics"""
    __tablename__ = 'api_usage'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key_id = db.Column(db.String(36), db.ForeignKey('api_keys.id'), nullable=False)
    
    # Request Info
    endpoint = db.Column(db.String(255), nullable=False)
    method = db.Column(db.String(10), default='POST')
    
    # Message/Query
    message = db.Column(db.Text)  # User এর প্রশ্ন (optional)
    
    # Response Info
    status = db.Column(db.String(20), default='success')  # success/error/rate_limited
    model_used = db.Column(db.String(50))  # mistral/fallback/etc
    processing_time = db.Column(db.Float)  # সেকেন্ডে
    
    # Error Tracking
    error_code = db.Column(db.String(50))
    error_message = db.Column(db.Text)
    
    # IP Address
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(255))
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'endpoint': self.endpoint,
            'status': self.status,
            'model': self.model_used,
            'processing_time': self.processing_time,
            'error': self.error_message,
            'timestamp': self.created_at.isoformat(),
            'ip': self.ip_address
        }


class APIKeyRequest(db.Model):
    """API Key Request/Approval (Optional - for premium features)"""
    __tablename__ = 'api_key_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Requester Info
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    project_name = db.Column(db.String(255), nullable=False)
    project_url = db.Column(db.String(255))
    
    # Requirements
    use_case = db.Column(db.Text)
    estimated_requests = db.Column(db.Integer)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending/approved/rejected
    approved_at = db.Column(db.DateTime)
    
    # Plan
    plan = db.Column(db.String(50), default='free')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'project': self.project_name,
            'status': self.status,
            'plan': self.plan,
            'created_at': self.created_at.isoformat()
        }
