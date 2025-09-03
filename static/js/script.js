// Animate auth button to alternate between Sign Up and Login every 3 seconds
document.addEventListener('DOMContentLoaded', function() {
    const authLink = document.getElementById('auth-link');
    let isSignUp = true;

    setInterval(function() {
        if (isSignUp) {
            authLink.textContent = 'Login';
            authLink.href = '/login';
        } else {
            authLink.textContent = 'Sign Up';
            authLink.href = '/signup';
        }
        isSignUp = !isSignUp;
    }, 3000);  // Change every 3 seconds
});