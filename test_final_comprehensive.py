"""
Final comprehensive test - Complete authentication and API service flow
"""
from application import application

print("="*60)
print("FINAL COMPREHENSIVE TEST")
print("="*60)

with application.test_client() as client:
    # === TEST 1: API Service for non-logged-in users ===
    print("\n1️⃣  API Service for NON-logged-in users")
    print("-" * 60)
    response = client.get('/api-service')
    assert response.status_code == 200, "API page should be accessible"
    html = response.data.decode()
    assert 'Login Required' in html, "Should show login prompt"
    assert 'Sign Up' in html, "Should show sign up link"
    assert 'Generate New API Key' not in html, "Should NOT show generate button"
    print("✓ API documentation visible")
    print("✓ Login prompt shown")
    print("✓ No generate button")
    
    # === TEST 2: Signup ===
    print("\n2️⃣  User Signup")
    print("-" * 60)
    signup_data = {
        'name': 'Final Test User',
        'email': 'finaltest@example.com',
        'password': 'FinalTest123',
        'confirm_password': 'FinalTest123',
        'company': 'Test Company'
    }
    response = client.post('/auth/signup', json=signup_data)
    assert response.status_code == 201, "Signup should succeed"
    data = response.json
    assert data['success'], "Signup response should be successful"
    assert '/auth/login' in data['redirect'], "Should redirect to login"
    print("✓ User created successfully")
    print("✓ Redirects to login page")
    
    # === TEST 3: Navbar without login ===
    print("\n3️⃣  Navbar (NOT logged in)")
    print("-" * 60)
    response = client.get('/')
    html = response.data.decode()
    assert 'Sign Up' in html, "Should show Sign Up button"
    assert 'User' not in html or 'user-dropdown' not in html, "Should NOT show user dropdown"
    print("✓ Shows Sign Up button")
    print("✓ No user dropdown")
    
    # === TEST 4: Login ===
    print("\n4️⃣  User Login")
    print("-" * 60)
    login_data = {
        'email': 'finaltest@example.com',
        'password': 'FinalTest123'
    }
    response = client.post('/auth/login', json=login_data)
    assert response.status_code == 200, "Login should succeed"
    data = response.json
    assert data['success'], "Login response should be successful"
    print("✓ Login successful")
    
    # === TEST 5: Navbar with login ===
    print("\n5️⃣  Navbar (Logged in)")
    print("-" * 60)
    response = client.get('/')
    html = response.data.decode()
    assert 'Final Test User' in html, "Should show user name"
    assert 'user-dropdown' in html or 'user-button' in html, "Should show user dropdown"
    print("✓ Shows user name in navbar")
    print("✓ Shows user dropdown menu")
    
    # === TEST 6: Profile page ===
    print("\n6️⃣  User Profile Page")
    print("-" * 60)
    response = client.get('/auth/profile')
    assert response.status_code == 200, "Profile should be accessible when logged in"
    html = response.data.decode()
    assert 'Final Test User' in html, "Profile should show user name"
    assert 'finaltest@example.com' in html, "Profile should show email"
    print("✓ Profile page loads")
    print("✓ Shows user information")
    
    # === TEST 7: API Service for logged-in users ===
    print("\n7️⃣  API Service for LOGGED-IN users")
    print("-" * 60)
    response = client.get('/api-service')
    assert response.status_code == 200, "API page should be accessible"
    html = response.data.decode()
    assert 'Generate New API Key' in html, "Should show generate button"
    assert 'Login Required' not in html, "Should NOT show login prompt"
    assert 'isLoggedIn = true' in html, "JavaScript should know user is logged in"
    print("✓ API documentation visible")
    print("✓ Generate button shown")
    print("✓ No login prompt")
    
    # === TEST 8: Generate API Key (simulate backend) ===
    print("\n8️⃣  Generate API Key")
    print("-" * 60)
    api_key_data = {
        'project_name': 'Test Integration',
        'description': 'free'
    }
    response = client.post('/auth/api-keys/generate', json=api_key_data)
    assert response.status_code == 201, "API key generation should succeed"
    data = response.json
    assert data['success'], "API key response should be successful"
    assert 'key' in data, "Should return API key"
    assert data['key'].startswith('cc_'), "API key should start with cc_"
    print("✓ API key generated")
    print(f"✓ Key format: {data['key'][:20]}...")
    
    # === TEST 9: List API Keys ===
    print("\n9️⃣  List User's API Keys")
    print("-" * 60)
    response = client.get('/auth/api-keys')
    assert response.status_code == 200, "API keys list should be accessible"
    data = response.json
    assert data['success'], "List response should be successful"
    assert len(data['keys']) > 0, "Should have at least 1 API key"
    assert data['keys'][0]['project_name'] == 'Test Integration', "Should match created project"
    print(f"✓ API keys retrieved ({len(data['keys'])} keys)")
    print(f"✓ Project: {data['keys'][0]['project_name']}")
    
    # === TEST 10: Logout ===
    print("\n🔟  User Logout")
    print("-" * 60)
    response = client.get('/auth/logout')
    assert response.status_code == 302, "Logout should redirect"
    print("✓ Logout successful")
    
    # === TEST 11: After Logout - API page ===
    print("\n1️⃣1️⃣  API Service After Logout")
    print("-" * 60)
    response = client.get('/api-service')
    assert response.status_code == 200, "API page should still be accessible"
    html = response.data.decode()
    assert 'Login Required' in html, "Should show login prompt again"
    assert 'Generate New API Key' not in html, "Should NOT show generate button"
    print("✓ Shows login prompt again")
    print("✓ Generate button hidden")
    
    # === TEST 12: After Logout - Navbar ===
    print("\n1️⃣2️⃣  Navbar After Logout")
    print("-" * 60)
    response = client.get('/')
    html = response.data.decode()
    assert 'Sign Up' in html, "Should show Sign Up button"
    assert 'Final Test User' not in html, "Should NOT show user name"
    print("✓ Shows Sign Up button")
    print("✓ User dropdown gone")

print("\n" + "="*60)
print("✅ ALL TESTS PASSED!")
print("="*60)
print("\n✨ COMPLETE AUTHENTICATION FLOW WORKING PERFECTLY ✨")
print("  ✓ Signup with database persistence")
print("  ✓ Login with session management")
print("  ✓ Navbar updates based on login state")
print("  ✓ Profile page accessible to logged-in users")
print("  ✓ API documentation visible to everyone")
print("  ✓ API key generation only for logged-in users")
print("  ✓ Logout clears session and access")
print("="*60)
