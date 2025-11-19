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
    const body = document.body;

    // Toggle menu and prevent body scroll
    navToggle.addEventListener('click', () => {
        const isActive = navLinks.classList.contains('active');
        
        if (!isActive) {
            // Open menu
            navLinks.classList.add('active');
            authButton.classList.add('active');
            navToggle.classList.add('active');
            body.style.overflow = 'hidden';
        } else {
            // Close menu
            navLinks.classList.remove('active');
            authButton.classList.remove('active');
            navToggle.classList.remove('active');
            body.style.overflow = 'auto';
        }
        console.log('Nav toggle clicked:', navLinks.classList.contains('active') ? 'Menu opened' : 'Menu closed');
    });

    // Close menu when clicking on a link
    const navLinkItems = document.querySelectorAll('.nav-links a, .auth-button a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            authButton.classList.remove('active');
            navToggle.classList.remove('active');
            body.style.overflow = 'auto';
        });
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            authButton.classList.remove('active');
            navToggle.classList.remove('active');
            body.style.overflow = 'auto';
        }
    });
});