#!/usr/bin/env python3
"""Test database functionality"""

import sys
sys.path.insert(0, '.')

from application import application, db
from models_api import User

# Create app context
with application.app_context():
    # Create all tables
    db.create_all()
    print("✓ Database tables created")
    
    # Test 1: Create a new user
    user = User(
        name='Test User',
        email='test@example.com',
        company_name='Test Company',
        is_active=True
    )
    user.set_password('password123')
    
    db.session.add(user)
    db.session.commit()
    print(f"✓ User created with ID: {user.id}")
    
    # Test 2: Query the user
    found_user = User.query.filter_by(email='test@example.com').first()
    if found_user:
        print(f"✓ User found: {found_user.name} ({found_user.email})")
    
    # Test 3: Verify password
    if found_user and found_user.check_password('password123'):
        print("✓ Password verification successful")
    else:
        print("✗ Password verification failed")
    
    # Test 4: Check database file exists
    import os
    if os.path.exists('chatbot_api.db'):
        size = os.path.getsize('chatbot_api.db')
        print(f"✓ Database file exists: chatbot_api.db ({size} bytes)")
    else:
        print("✗ Database file not found")
    
    print("\n✓ All tests passed!")
