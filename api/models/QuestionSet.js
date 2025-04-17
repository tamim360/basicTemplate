import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: Number,
  question: String,
  A: String,
  B: String,
  C: String,
  D: String,
  image: String, // Cloudinary URL
  MCA1: String,
  MCA2: String,
  MCA3: String,
  correctAnswer: String,
});

const questionSetSchema = new mongoose.Schema({
  currentNumber: Number,
  allQuestionData: [questionSchema],
});

const QuestionSet = mongoose.model("QuestionSet", questionSetSchema);
export default QuestionSet;
