import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
const PORT = process.env.PORT || 8080;

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Question Schema
const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  A: String,
  B: String,
  C: String,
  D: String,
  image: String,
  MCA1: String,
  MCA2: String,
  MCA3: String,
  correctAnswer: String,
});

// Quiz Session Schema
const quizSessionSchema = new mongoose.Schema({
  allQuestionData: [questionSchema],
  currentNumber: Number,
});

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);

// Save Endpoint
app.post("/api/save", async (req, res) => {
  try {
    const { allQuestionData, currentNumber } = req.body;
    const newSession = new QuizSession({ allQuestionData, currentNumber });
    await newSession.save();
    res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving data", error: error.message });
  }
});

//generate signature
app.get("/generate-cloudinary-signature", (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp };

  // Generate signature using API_SECRET
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
