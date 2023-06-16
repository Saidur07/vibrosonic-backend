const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Enable CORS for multiple origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://vibrosonic.onrender.com",
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

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
const storage = multer.memoryStorage();
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

  // Create a new FormData object
  const formData = new FormData();
  formData.append("image", req.file.buffer.toString("base64"));

  try {
    // Make a POST request to the ImgBB API
    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData,
      {
        params: {
          key: "31e2906cfb3dfa8c95941117caeae2b6",
        },
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    // Extract the image URL from the response
    const imageUrl = response.data.data.url;

    // Create a new PDF document in the database with the image URL
    const pdf = new PDF({
      username: user.name,
      pdfname: imageUrl,
    });

    await pdf.save();

    res.json({ success: true, pdf });
  } catch (error) {
    console.error("Error uploading file to ImgBB:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// PDF listing endpoint
app.get("/pdfs", async (req, res) => {
  // Retrieve all PDF documents from the database
  const pdfs = await PDF.find();

  res.json(pdfs);
});

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
