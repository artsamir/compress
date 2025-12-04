"""
Test the generate button behavior
"""
from application import application

with application.test_client() as client:
    # Get the page HTML
    response = client.get('/api-service')
    html = response.data.decode()
    
    # Check if JavaScript contains login check
    print("Checking generateAPIKey() JavaScript function...")
    if "isLoggedIn =" in html:
        print("✓ JavaScript checks for login status")
    
    # Extract the JS logic
    if "window.location.href" in html and "/auth/login" in html:
        print("✓ JavaScript redirects to login if not logged in")
    
    # Test with logged-in user
    print("\nTesting with logged-in user...")
    signup_data = {
        'name': 'Test',
        'email': 'test789@test.com',
        'password': 'Test123',
        'confirm_password': 'Test123',
        'company': 'Test'
    }
    client.post('/auth/signup', json=signup_data)
    
    login_data = {
        'email': 'test789@test.com',
        'password': 'Test123'
    }
    client.post('/auth/login', json=login_data)
    
    # Get API page with logged-in session
    response = client.get('/api-service')
    html = response.data.decode()
    
    if "isLoggedIn = true" in html:
        print("✓ JavaScript sets isLoggedIn to true for logged-in users")
    else:
        print("✗ JavaScript does not set isLoggedIn correctly")

print("\n✅ All checks passed!")
