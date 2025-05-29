document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token"); // Get token from local storage

    if (!token) {
        alert("Access Denied: No Token Provided");
        window.location.href = "login.html"; // Redirect to login
        return;
    }

    try {
        // Fetch Tests for Admin Dashboard
        const response = await fetch("http://localhost:3000/admin/tests", {
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
                alert("Access Denied! You are not authorized to view this page.");
            } else {
                alert("Failed to fetch tests. Please try again.");
            }
            window.location.href = "login.html";
            return;
        }

        const tests = await response.json();
        console.log("Fetched Tests:", tests);

        // Display the tests in the UI
        const testListContainer = document.getElementById("test-list");
        testListContainer.innerHTML = ""; // Clear any existing content
        tests.forEach(test => {
            const testItem = document.createElement("div");
            testItem.classList.add("test-item");
            testItem.innerHTML = `
                <h4>${test.subject}</h4>
                <p>Duration: ${test.duration} minutes</p>
                <button onclick="deleteTest('${test._id}')">Delete</button>
            `;
            testListContainer.appendChild(testItem);
        });

    } catch (error) {
        console.error("Error fetching tests:", error);
        alert("Error fetching tests. Check your internet or server.");
    }
});

// Function to Add a New Test
async function addTest(testData) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Access Denied: No Token Provided");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/admin/tests", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(testData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to add test.");
        }

        const data = await response.json();
        console.log("Test Added:", data);
        alert("Test added successfully!");
        location.reload(); // Refresh the page to show the new test
    } catch (error) {
        console.error("Error adding test:", error);
        alert(error.message || "Error adding test. Try again.");
    }
}

// Toggle Test Form Visibility
function toggleTestForm() {
    const formContainer = document.getElementById("test-form-container");
    formContainer.classList.toggle("hidden");
}

// Logout Function
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// Delete Test Function
async function deleteTest(testId) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Access Denied: No Token Provided");
        window.location.href = "login.html";
        return;
    }

    if (!confirm("Are you sure you want to delete this test?")) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/admin/tests/${testId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete test.");
        }

        alert("Test deleted successfully!");
        location.reload(); // Refresh the page to update the test list
    } catch (error) {
        console.error("Error deleting test:", error);
        alert(error.message || "Error deleting test. Try again.");
    }
}

// Add Question to Form
function addQuestion() {
    const questionsContainer = document.getElementById('questions-container');
    const questionCount = questionsContainer.children.length + 1;

    const questionBlock = document.createElement('div');
    questionBlock.className = 'question-block';
    questionBlock.innerHTML = `
        <label>Question ${questionCount}:</label>
        <input type="text" class="question-text" required>
        <div class="options-container">
            <input type="text" class="option" placeholder="Option 1" required>
            <input type="text" class="option" placeholder="Option 2" required>
            <input type="text" class="option" placeholder="Option 3" required>
            <input type="text" class="option" placeholder="Option 4" required>
        </div>
        <label>Correct Answer (1-4):</label>
        <input type="number" class="correct-answer" min="1" max="4" required>
        <button type="button" onclick="this.parentElement.remove()">Remove Question</button>
    `;

    questionsContainer.appendChild(questionBlock);
}

// Handle Test Form Submit
async function handleTestSubmit(event) {
    event.preventDefault();

    const subject = document.getElementById('subject').value;
    const duration = parseInt(document.getElementById('duration').value);
    const questions = [];

    // Collect all questions
    const questionBlocks = document.querySelectorAll('.question-block');
    questionBlocks.forEach(block => {
        const questionText = block.querySelector('.question-text').value;
        const options = Array.from(block.querySelectorAll('.option')).map(opt => opt.value);
        const correctAnswer = parseInt(block.querySelector('.correct-answer').value) - 1; // Convert to 0-based index

        questions.push({
            text: questionText,
            options: options,
            correctAnswer: correctAnswer
        });
    });

    const testData = {
        subject,
        duration,
        questions,
        availableFor: ['Student'] // Default to available for all students
    };

    await addTest(testData);
}
