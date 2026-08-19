const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
  {
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
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true },
);

examAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);

module.exports = ExamAttempt;
