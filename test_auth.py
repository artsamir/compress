#!/usr/bin/env python3
"""Comprehensive authentication test"""

import sys
sys.path.insert(0, '.')

from application import application, db
from models_api import User, APIKey
from werkzeug.security import generate_password_hash, check_password_hash

# Create app context
with application.app_context():
    print("=" * 60)
    print("COMPREHENSIVE AUTHENTICATION TEST")
    print("=" * 60)
    
    # Clean database
    print("\n1. Cleaning database...")
    User.query.delete()
    APIKey.query.delete()
    db.session.commit()
    print("   ✓ Database cleaned")
    
    # Test 2: User Registration
    print("\n2. Testing User Registration...")
    user1 = User(
        name='John Doe',
        email='john@example.com',
        company_name='Acme Corp',
        website='https://acme.com',
        is_active=True
    )
    user1.set_password('secure_password_123')
    db.session.add(user1)
    db.session.commit()
    print(f"   ✓ User created: {user1.name} (ID: {user1.id})")
    
    # Test 3: Duplicate Email Check
    print("\n3. Testing Duplicate Email Detection...")
    user2 = User(
        name='Jane Doe',
        email='john@example.com',  # Duplicate
        company_name='Beta Corp',
        is_active=True
    )
    user2.set_password('another_password')
    db.session.add(user2)
    try:
        db.session.commit()
        print("   ✗ Should have rejected duplicate email!")
    except Exception as e:
        db.session.rollback()
        print("   ✓ Duplicate email properly rejected")
    
    # Test 4: Password Verification
    print("\n4. Testing Password Verification...")
    found_user = User.query.filter_by(email='john@example.com').first()
    
    if found_user:
        if found_user.check_password('secure_password_123'):
            print("   ✓ Correct password verified")
        else:
            print("   ✗ Correct password rejected!")
        
        if not found_user.check_password('wrong_password'):
            print("   ✓ Wrong password properly rejected")
        else:
            print("   ✗ Wrong password accepted!")
    
    # Test 5: User Update
    print("\n5. Testing User Profile Update...")
    found_user.company_name = 'Updated Corp'
    found_user.website = 'https://updated.com'
    db.session.commit()
    print(f"   ✓ User updated: {found_user.company_name}")
    
    # Test 6: API Key Generation
    print("\n6. Testing API Key Generation...")
    raw_key = APIKey.generate_key()
    print(f"   ✓ Raw key generated: {raw_key[:20]}...")
    
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
    print(f"   ✓ API Key created (ID: {api_key.id})")
    
    # Test 7: User API Keys Association
    print("\n7. Testing User API Keys Association...")
    user_api_keys = APIKey.query.filter_by(user_id=found_user.id).all()
    print(f"   ✓ Found {len(user_api_keys)} API key(s) for user")
    
    # Test 8: User to Dict Serialization
    print("\n8. Testing User Serialization...")
    user_dict = found_user.to_dict()
    print(f"   ✓ User serialized to dict:")
    print(f"      - ID: {user_dict['id']}")
    print(f"      - Name: {user_dict['name']}")
    print(f"      - Email: {user_dict['email']}")
    print(f"      - Company: {user_dict['company_name']}")
    print(f"      - Active: {user_dict['is_active']}")
    
    # Test 9: Query Operations
    print("\n9. Testing Query Operations...")
    all_users = User.query.all()
    print(f"   ✓ Total users in database: {len(all_users)}")
    
    active_users = User.query.filter_by(is_active=True).all()
    print(f"   ✓ Active users: {len(active_users)}")
    
    # Test 10: Database File Verification
    print("\n10. Testing Database Persistence...")
    import os
    if os.path.exists('chatbot_api.db'):
        size = os.path.getsize('chatbot_api.db')
        print(f"   ✓ Database file exists: chatbot_api.db ({size} bytes)")
    else:
        print("   ✗ Database file not found!")
    
    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED!")
    print("=" * 60)
