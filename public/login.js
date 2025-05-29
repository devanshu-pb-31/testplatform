document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }) 
    });

    const data = await response.json();

    if (response.ok) {
        alert("Login successful!");

        //  Store JWT token in localStorage
        localStorage.setItem("token", data.token);

        //  Redirect user based on role
        if (data.role === "Student") {
            window.location.href = "student-dashboard.html"; // Redirect to Student Dashboard
        } else if (data.role === "Admin") {
            window.location.href = "admin-dashboard.html"; // Redirect to Admin Dashboard
        }
    } else {
        alert(data.message);
    }
});
