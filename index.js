const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers, *, Access-Control-Allow-Origin",
    "Origin, X-Requested-with, Content_Type,Accept,Authorization",
    "http://localhost:3000"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT,POST,PATCH,DELETE,GET");
    return res.status(200).json({});
  }
  next();
});
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
    name: "Al Mustafiz Bappy",
    email: "bappy@gmail.com",
    password: "abcd1234",
  },
  {
    id: 3,
    name: "Demo User",
    email: "demo@demo.demo",
    password: "demo1234",
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
app.use("/pdfs", express.static("uploads"));

// Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling for other errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
