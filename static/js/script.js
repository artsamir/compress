document.addEventListener('DOMContentLoaded', function() {
    // Animate auth button to alternate between Sign Up and Login every 3 seconds
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

    // Hamburger menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const authButton = document.querySelector('.auth-button');

    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        authButton.classList.toggle('active');
        navToggle.classList.toggle('active');
        console.log('Nav toggle clicked:', navLinks.classList.contains('active') ? 'Menu opened' : 'Menu closed');
    });
});