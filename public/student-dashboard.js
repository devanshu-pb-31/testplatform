document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token"); //Get stored token

    if (!token) {
        alert("Access Denied: No Token Provided");
        window.location.href = "login.html"; // Redirect to login
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/get-tests", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Session expired. Please log in again.");
            } else if (response.status === 403) {
                alert("Access Denied! You are not allowed to view tests.");
            } else {
                alert("Failed to fetch tests. Please try again.");
            }
            window.location.href = "login.html";
            return;
        }

        const tests = await response.json();
        console.log("Fetched Tests:", tests); // Show tests in console

        const container = document.getElementById("test-container");
        container.innerHTML = ""; // Clear previous content

        tests.forEach(test => {
            const card = document.createElement("div");
            card.classList.add("test-card");
            card.innerHTML = `
                <h3>${test.subject}</h3>
                <p>Duration: ${test.duration} minutes</p>
                <button onclick="startTest('${test._id}')">Start Test</button>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching tests:", error);
        alert("Error fetching tests. Check your internet or server.");
    }
});

function startTest(testId) {
    window.location.href = `test.html?testId=${testId}`;
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
