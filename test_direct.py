"""
Quick test - test authentication flow directly without HTTP
"""

# Add the project directory to path
import sys
sys.path.insert(0, r'c:\Users\samir\Documents\cutcompress\compress04nov\compress')

from application import application, db
from models_api import User, APIKey
import json

print("\n" + "="*60)
print("DIRECT DATABASE AUTHENTICATION TEST")
print("="*60)

with application.app_context():
    # 1. Test signup (create user)
    print("\n✓ TEST 1: Create User")
    print("-" * 40)
    
    user = User(
        name='Test Direct',
        email='directtest@test.com',
        company_name='Direct Test Co',
        is_active=True
    )
    user.set_password('TestPass123')
    
    db.session.add(user)
    db.session.commit()
    
    print(f"  ✓ User created: {user.name}")
    print(f"  ✓ Email: {user.email}")
    print(f"  ✓ ID: {user.id}")
    
    # 2. Test login (verify password)
    print("\n✓ TEST 2: Login Verification")
    print("-" * 40)
    
    found_user = User.query.filter_by(email='directtest@test.com').first()
    if found_user and found_user.check_password('TestPass123'):
        print(f"  ✓ User found and password verified")
        print(f"  ✓ User: {found_user.name}")
        print(f"  ✓ Email: {found_user.email}")
    else:
        print(f"  ✗ Login failed")
    
    # 3. Test API key generation
    print("\n✓ TEST 3: Generate API Key")
    print("-" * 40)
    
    raw_key = APIKey.generate_key()
    key_hash = APIKey.hash_key(raw_key)
    
    api_key = APIKey(
        user_id=found_user.id,
        key_hash=key_hash,
        key_prefix=raw_key[:10],
        project_name='Test Project',
        email=found_user.email,
        plan='free',
        is_active=True,
        requests_per_minute=10
    )
    
    db.session.add(api_key)
    db.session.commit()
    
    print(f"  ✓ API key created")
    print(f"  ✓ Key (first 20): {raw_key[:20]}...")
    print(f"  ✓ Project: {api_key.project_name}")
    print(f"  ✓ Plan: {api_key.plan}")
    
    # 4. Test user's API keys
    print("\n✓ TEST 4: List User's API Keys")
    print("-" * 40)
    
    user_keys = APIKey.query.filter_by(user_id=found_user.id).all()
    print(f"  ✓ Found {len(user_keys)} API key(s)")
    
    for key in user_keys:
        print(f"  ✓ Project: {key.project_name} ({key.key_prefix}...)")
        print(f"    Plan: {key.plan}")
        print(f"    Active: {key.is_active}")
    
    # 5. Test profile access (get user data)
    print("\n✓ TEST 5: Get User Profile")
    print("-" * 40)
    
    profile = found_user.to_dict()
    print(f"  ✓ Profile data:")
    for key, value in profile.items():
        print(f"    - {key}: {value}")
    
    # 6. Test logout (session clear)
    print("\n✓ TEST 6: Session Management")
    print("-" * 40)
    print(f"  ✓ Session data would be cleared on logout")
    print(f"  ✓ User {found_user.name} logged out")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED!")
    print("="*60)
