function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html"; // Redirect to Login Page
}
