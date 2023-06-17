const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const { PDFDocument } = require("pdf-lib");

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Enable CORS for multiple origins
const allowedOrigins = [
  "http://localhost:3000",
"https://vibrosonic.vercel.app",
  "https://vibrosonic.onrender.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);
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
mongoose
  .connect(
    "mongodb+srv://dbuser1:ZnZVmALY1iLIhX50@cluster0.asefh.mongodb.net/demoapp?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
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
  formData.append("image", req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });
  const url =
    "https://api.imgbb.com/1/upload?key=31e2906cfb3dfa8c95941117caeae2b6";
  try {
    // Make a POST request to the ImgBB API
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    // Extract the image URL from the response
    const imageUrl = response.data.data.url;

    try {
      // Create a new PDF document in the database with the image URL
      const pdf = new PDF({
        username: user.name,
        pdfname: imageUrl,
      });

      await pdf.save();

      res.json({ success: true, pdf });
    } catch (error) {
      console.error("Error saving PDF to the database:", error);
      res.status(500).json({ error: "Failed to save PDF" });
    }
  } catch (error) {
    console.error("Error uploading file to ImgBB:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Download PDF endpoint
app.get("/download/:id", async (req, res) => {
  const pdfId = req.params.id;

  try {
    // Find the PDF document in the database by ID
    const pdf = await PDF.findById(pdfId);

    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    const imageUrl = pdf.pdfname;

    try {
      // Fetch the image data from the provided URL
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data, "binary");

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const image = await pdfDoc.embedPng(imageBuffer);

      // Create a new page and add the image to it
      const page = pdfDoc.addPage();
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });

      // Serialize the PDF document to a Uint8Array
      const pdfBytes = await pdfDoc.save();

      // Set the response headers for file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pdfId}.pdf"`
      );

      // Send the PDF file as the response
      res.send(pdfBytes);
    } catch (error) {
      console.error("Error fetching image data:", error);
      res.status(500).json({ error: "Failed to fetch image data" });
    }
  } catch (error) {
    console.error("Error finding PDF in the database:", error);
    res.status(500).json({ error: "Failed to find PDF" });
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
