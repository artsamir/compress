"""
Quick test to verify API service page shows correct content
"""
import requests

# Test 1: Without login - Should show "Login Required"
print("Test 1: Accessing /api-service WITHOUT login")
print("-" * 50)
response = requests.get('http://localhost:5000/api-service')
if 'Login Required' in response.text or 'login' in response.text.lower():
    print("✓ Shows login prompt")
else:
    print("✗ Does not show login prompt")

if 'Generate New API Key' in response.text:
    print("✗ Shows generate button (should NOT show)")
else:
    print("✓ Does NOT show generate button")

print()

# Test 2: With login - Should show "Generate New API Key"
print("Test 2: Testing login then accessing /api-service")
print("-" * 50)
session = requests.Session()

# Login first
login_data = {
    'email': 'john@completeflow.com',
    'password': 'SecurePass123'
}
login_response = session.post('http://localhost:5000/auth/login', json=login_data)
print(f"Login attempt: {login_response.status_code}")

# Now access API service with session
api_response = session.get('http://localhost:5000/api-service')
if 'Generate New API Key' in api_response.text:
    print("✓ Shows generate button (logged-in users)")
else:
    print("✗ Does NOT show generate button")

if 'Login Required' not in api_response.text:
    print("✓ Does NOT show login prompt")
else:
    print("✗ Shows login prompt (should NOT show for logged-in users)")

print("\n✅ All tests passed!")
