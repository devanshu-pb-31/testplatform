require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));


// Serve Static Files (Frontend)
app.use(express.static(__dirname + "/public"));

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.error(" MongoDB Connection Error:", err));

//  User Schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String
});
const User = mongoose.model("User", userSchema);

//  Test Schema
const testSchema = new mongoose.Schema({
    subject: String,
    duration: Number,
    questions: [{
        text: String,
        options: [String],
        correctAnswer: Number
    }],
    availableFor: [String]
});
const Test = mongoose.model("Test", testSchema);

// Middleware to Verify JWT
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};


//  Register User
app.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!role || !["Student", "Admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be Student or Admin." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});

//  Login User
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password!" });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });


        res.json({ message: "Login successful!", token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
});

//  Fetch Tests (For Students)
app.get("/get-tests", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Student") {
            return res.status(403).json({ message: "Access Denied! Only students can view tests." });
        }

        const tests = await Test.find();
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tests", error });
    }
});

//  Fetch Tests (For Admin)
app.get("/admin/tests", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access Denied! Only admins can view tests." });
        }

        const tests = await Test.find();
        res.json(tests);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tests", error });
    }
});

// Add Test (For Admin)
app.post("/admin/tests", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access Denied! Only admins can add tests." });
        }

        const { subject, duration, questions, availableFor } = req.body;
        const newTest = new Test({
            subject,
            duration,
            questions,
            availableFor
        });

        await newTest.save();
        res.status(201).json({ message: "Test added successfully!", test: newTest });
    } catch (error) {
        res.status(500).json({ message: "Error adding test", error });
    }
});

// Delete Test (For Admin)
app.delete("/admin/tests/:id", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access Denied! Only admins can delete tests." });
        }

        const test = await Test.findByIdAndDelete(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }
        res.json({ message: "Test deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting test", error });
    }
});

//  Upload Excel File (For Admin)
const upload = multer({ dest: "uploads/" });

app.post("/admin/upload-tests", authenticateUser, upload.single("file"), async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({ message: "Access Denied! Only admins can upload tests." });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const tests = data.map(row => ({
            subject: row.Subject,
            duration: row.Duration,
            questions: JSON.parse(row.Questions),
            availableFor: row.AvailableFor.split(",")
        }));

        await Test.insertMany(tests);

        fs.unlinkSync(filePath); // Remove file after processing
        res.status(201).json({ message: "Tests uploaded successfully!" });

    } catch (error) {
        res.status(500).json({ message: "Error uploading tests", error });
    }
});

//  Logout (Clear Token)
app.post("/logout", (req, res) => {
    res.json({ message: "Logout successful!" });
});

// Get Single Test (For Students)
app.get("/get-test/:id", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Student") {
            return res.status(403).json({ message: "Access Denied! Only students can take tests." });
        }

        const test = await Test.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        res.json(test);
    } catch (error) {
        res.status(500).json({ message: "Error fetching test", error });
    }
});

// Submit Test (For Students)
app.post("/submit-test", authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== "Student") {
            return res.status(403).json({ message: "Access Denied! Only students can submit tests." });
        }

        const { testId, answers } = req.body;
        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        // Calculate score
        let score = 0;
        test.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                score++;
            }
        });

        // Calculate percentage
        const percentage = (score / test.questions.length) * 100;

        // Save test result (you can create a TestResult model if needed)
        res.json({
            message: "Test submitted successfully",
            score: percentage.toFixed(2) + "%"
        });
    } catch (error) {
        res.status(500).json({ message: "Error submitting test", error });
    }
});

//  Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
