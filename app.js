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

// Login endpoint
app.post("/login", (req, res) => {
  // Implement your login logic here
  // Verify the provided email and password against the stored user information
  // If valid, return a success response; otherwise, return an error response
});

// Upload PDF endpoint
app.post("/upload", upload.single("pdf"), (req, res) => {
  // Create a new PDF document in the database
  const pdf = new PDF({
    username: req.body.username,
    pdfname: req.file.filename,
  });

  pdf.save((err, pdf) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to save PDF" });
    }

    res.json({ success: true, pdf });
  });
});

// PDF listing endpoint
app.get("/pdfs", (req, res) => {
  // Retrieve all PDF documents from the database
  PDF.find({}, (err, pdfs) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to fetch PDFs" });
    }

    res.json(pdfs);
  });
});

// Serve PDF files endpoint
app.get("/pdfs/:filename", (req, res) => {
  const filename = req.params.filename;
  res.sendFile(`${__dirname}/uploads/${filename}`);
});

// Start the server
app.listen(3001, () => {
  console.log("Server is running on port 3000");
});
