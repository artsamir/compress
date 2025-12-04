"""
Complete Authentication Flow Test
signup -> login -> profile -> api key generation -> logout
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"
SESSION = requests.Session()

def test_signup():
    """Test user signup"""
    print("\n✓ TEST 1: User Signup")
    print("-" * 50)
    
    data = {
        'name': 'Test User Complete',
        'email': 'testcomplete@example.com',
        'password': 'Test@123456',
        'confirm_password': 'Test@123456',
        'company': 'Test Company Inc'
    }
    
    response = SESSION.post(f'{BASE_URL}/auth/signup', json=data)
    result = response.json()
    
    if result['success']:
        print(f"  ✓ Signup successful")
        print(f"  ✓ User: {data['name']} ({data['email']})")
        print(f"  ✓ Redirect URL: {result.get('redirect')}")
        print(f"  ✓ Message: {result['message']}")
        return True, data['email'], data['password']
    else:
        print(f"  ✗ Signup failed: {result['error']}")
        return False, None, None

def test_login(email, password):
    """Test user login"""
    print("\n✓ TEST 2: User Login")
    print("-" * 50)
    
    data = {
        'email': email,
        'password': password
    }
    
    response = SESSION.post(f'{BASE_URL}/auth/login', json=data)
    result = response.json()
    
    if result['success']:
        print(f"  ✓ Login successful")
        print(f"  ✓ Email: {email}")
        print(f"  ✓ Redirect URL: {result.get('redirect')}")
        print(f"  ✓ Session cookies: {len(SESSION.cookies)}")
        return True
    else:
        print(f"  ✗ Login failed: {result['error']}")
        return False

def test_profile():
    """Test getting user profile"""
    print("\n✓ TEST 3: Get User Profile")
    print("-" * 50)
    
    response = SESSION.get(f'{BASE_URL}/auth/profile')
    
    if response.status_code == 200:
        print(f"  ✓ Profile page loaded successfully")
        print(f"  ✓ Status code: {response.status_code}")
        print(f"  ✓ Response size: {len(response.text)} bytes")
        
        # Check if HTML contains user info
        if 'profile' in response.text.lower():
            print(f"  ✓ Profile content verified")
        
        return True
    else:
        print(f"  ✗ Profile access failed: {response.status_code}")
        return False

def test_api_key_generation():
    """Test API key generation"""
    print("\n✓ TEST 4: Generate API Key")
    print("-" * 50)
    
    data = {
        'project_name': 'Test Project',
        'description': 'free'
    }
    
    response = SESSION.post(f'{BASE_URL}/auth/api-keys/generate', json=data)
    result = response.json()
    
    if result['success']:
        api_key = result.get('key')
        print(f"  ✓ API key generated successfully")
        print(f"  ✓ Project: {result.get('project')}")
        print(f"  ✓ Key (first 20 chars): {api_key[:20]}...")
        print(f"  ✓ Warning: {result.get('warning')}")
        return True, api_key
    else:
        print(f"  ✗ API key generation failed: {result['error']}")
        return False, None

def test_list_api_keys():
    """Test listing user's API keys"""
    print("\n✓ TEST 5: List User's API Keys")
    print("-" * 50)
    
    response = SESSION.get(f'{BASE_URL}/auth/api-keys')
    result = response.json()
    
    if result['success']:
        keys = result.get('keys', [])
        print(f"  ✓ API keys retrieved successfully")
        print(f"  ✓ Total keys: {len(keys)}")
        
        for i, key in enumerate(keys, 1):
            print(f"  ✓ Key {i}: {key['project_name']} ({key['key_prefix']}...)")
            print(f"      Created: {key['created_at']}")
            print(f"      Plan: {key['plan']}")
        
        return True
    else:
        print(f"  ✗ Failed to list API keys: {result['error']}")
        return False

def test_logout():
    """Test user logout"""
    print("\n✓ TEST 6: User Logout")
    print("-" * 50)
    
    response = SESSION.get(f'{BASE_URL}/auth/logout')
    
    if response.status_code == 200:
        print(f"  ✓ Logout successful")
        print(f"  ✓ Session cleared")
        print(f"  ✓ Remaining cookies: {len(SESSION.cookies)}")
        return True
    else:
        print(f"  ✗ Logout failed: {response.status_code}")
        return False

def test_profile_access_after_logout():
    """Test that profile is not accessible after logout"""
    print("\n✓ TEST 7: Verify Access Control (After Logout)")
    print("-" * 50)
    
    response = SESSION.get(f'{BASE_URL}/auth/profile')
    
    # Should redirect to login or return 302
    if response.status_code in [301, 302] or response.url != f'{BASE_URL}/auth/profile':
        print(f"  ✓ Profile access properly denied after logout")
        print(f"  ✓ Status code: {response.status_code}")
        print(f"  ✓ Redirected to: {response.url}")
        return True
    else:
        print(f"  ✗ Security issue: Profile still accessible after logout")
        return False

def main():
    print("\n" + "="*60)
    print("COMPLETE AUTHENTICATION FLOW TEST")
    print("Signup → Login → Profile → API Keys → Logout")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    
    # Test sequence
    tests_passed = 0
    tests_total = 0
    
    # 1. Signup
    tests_total += 1
    signup_success, email, password = test_signup()
    if signup_success:
        tests_passed += 1
    else:
        print("\n❌ Signup failed. Stopping tests.")
        return
    
    time.sleep(1)
    
    # 2. Login
    tests_total += 1
    if test_login(email, password):
        tests_passed += 1
    else:
        print("\n❌ Login failed. Stopping tests.")
        return
    
    time.sleep(1)
    
    # 3. Profile
    tests_total += 1
    if test_profile():
        tests_passed += 1
    else:
        print("\n⚠️  Profile test failed, but continuing...")
    
    time.sleep(1)
    
    # 4. Generate API Key
    tests_total += 1
    key_success, api_key = test_api_key_generation()
    if key_success:
        tests_passed += 1
    else:
        print("\n⚠️  API key generation failed, but continuing...")
    
    time.sleep(1)
    
    # 5. List API Keys
    tests_total += 1
    if test_list_api_keys():
        tests_passed += 1
    else:
        print("\n⚠️  List API keys failed, but continuing...")
    
    time.sleep(1)
    
    # 6. Logout
    tests_total += 1
    if test_logout():
        tests_passed += 1
    else:
        print("\n⚠️  Logout failed, but continuing...")
    
    time.sleep(1)
    
    # 7. Verify access control
    tests_total += 1
    if test_profile_access_after_logout():
        tests_passed += 1
    else:
        print("\n❌ Access control test failed")
    
    # Summary
    print("\n" + "="*60)
    print(f"TEST RESULTS: {tests_passed}/{tests_total} passed")
    print("="*60)
    
    if tests_passed == tests_total:
        print("✅ ALL TESTS PASSED - Complete flow is working!")
    else:
        print(f"⚠️  {tests_total - tests_passed} test(s) failed")

if __name__ == '__main__':
    main()
