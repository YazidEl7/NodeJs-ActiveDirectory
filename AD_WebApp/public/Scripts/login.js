document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Perform client-side validation
    if (!isValidEmail(username)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (password.length < 7) {
        alert('Password must be at least 7 characters long.');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.redirected) {
            // Redirect to the provided URL if the server response indicates a redirect
            window.location.href = response.url;
        } else {
            // Show an alert message if login failed
            alert('Login failed. Please check your credentials.');
        }
    } catch (error) {
        // Log and show an error message if an error occurs during the fetch request
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }
});

function isValidEmail(email) {
    // Use a regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
