const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/demoapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a Schema for PDF documents
const pdfSchema = new mongoose.Schema({
  username: String,
  pdfname: String,
  date: { type: Date, default: Date.now },
});

// Create a Model for PDF documents
const PDF = mongoose.model("PDF", pdfSchema);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// Array of user objects
const users = [
  {
    id: 1,
    name: "Saidur Rahman",
    email: "saidurhere@gmail.com",
    password: "abcd1234",
  },
  {
    id: 2,
    name: "Saidur Rahman2",
    email: "saidurhere2@gmail.com",
    password: "abcd1234",
  },
  {
    id: 3,
    name: "Saidur Rahman3",
    email: "saidurhere3@gmail.com",
    password: "abcd1234",
  },
];

// Login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Find the user with the provided email
  const user = users.find((user) => user.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({ success: true, user });
});

// Upload PDF endpoint
app.post("/upload", upload.single("pdf"), async (req, res) => {
  const { email } = req.body;

  // Find the user with the provided email
  const user = users.find((user) => user.email === email);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Create a new PDF document in the database
  const pdf = new PDF({
    username: user.name,
    pdfname: req.file.filename,
  });

  await pdf.save();

  res.json({ success: true, pdf });
});

// PDF listing endpoint
app.get("/pdfs", async (req, res) => {
  // Retrieve all PDF documents from the database
  const pdfs = await PDF.find();

  res.json(pdfs);
});

// Serve PDF files endpoint
app.get("/pdfs/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`${__dirname}/uploads/${filename}`);
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
