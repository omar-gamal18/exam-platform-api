const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    selectedOptionId: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: [true, "provide the exam id"],
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "provide the student id"],
  },
  answers: {
    type: [answerSchema],
    required: true,
  },
  totalScore: { type: Number, required: true, min: 0 },
  submittedAt: { type: Date, required: true, default: Date.now },
});
