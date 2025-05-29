document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role-toggle").checked ? "Admin" : "Student";

    const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
        alert("Signup successful! Please login.");
        window.location.href = "login.html"; // Redirect to login page
    } else {
        alert(data.message);
    }
});
