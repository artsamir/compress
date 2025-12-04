"""
Debug test to check session handling
"""
import requests

session = requests.Session()

# First signup a new user
print("Step 1: Signup new user")
signup_data = {
    'name': 'Test User',
    'email': 'testuser@example.com',
    'password': 'TestPass123',
    'confirm_password': 'TestPass123',
    'company': 'Test'
}
signup_response = session.post('http://localhost:5000/auth/signup', json=signup_data)
print(f"Signup status: {signup_response.status_code}")
print(f"Signup response: {signup_response.json()}")
print(f"Session cookies after signup: {dict(session.cookies)}")
print()

# Now login
print("Step 2: Login user")
login_data = {
    'email': 'testuser@example.com',
    'password': 'TestPass123'
}
login_response = session.post('http://localhost:5000/auth/login', json=login_data)
print(f"Login status: {login_response.status_code}")
print(f"Login response: {login_response.json()}")
print(f"Session cookies after login: {dict(session.cookies)}")
print()

# Check if we can access profile
print("Step 3: Check profile access")
profile_response = session.get('http://localhost:5000/auth/profile')
print(f"Profile status: {profile_response.status_code}")
if 'Test User' in profile_response.text:
    print("✓ Can access profile")
else:
    print("✗ Cannot access profile")
print()

# Check API service page
print("Step 4: Check API service page")
api_response = session.get('http://localhost:5000/api-service')
print(f"API service status: {api_response.status_code}")
if 'Generate New API Key' in api_response.text:
    print("✓ Shows generate button")
else:
    print("✗ Does NOT show generate button")
    print("\nChecking for 'Login Required'...")
    if 'Login Required' in api_response.text:
        print("✗ Still showing login required (session not working)")
    print("\nSearching for session reference in page...")
    if 'session' in api_response.text:
        print("✓ Page contains 'session' reference")
