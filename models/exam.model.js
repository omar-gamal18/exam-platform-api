const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: Number,
    questionText: {
      type: String,
      required: [true, "provide the question text please"],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["mcq", "true_false"],
      required: [true, "provide the question type please"],
    },
    points: {
      type: Number,
      min: 1,
      required: [true, "provide the answer points please"],
    },
    options: [
      {
        optionId: Number,
        text: {
          type: String,
          required: [true, "provide the quetion text"],
        },
      },
      { _id: false },
    ],
    correctOptionId: {
      type: Number,
      required: [true, "provide the correct option ID please"],
    },
  },
  { _id: false },
);

const examSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Exam must belong to an instructor"],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Exam must belong to a subject"],
    },
    department: {},
    year: {
      type: Number,
      min: 1,
      max: 4,
      required: true,
    },
    examType: {
      type: String,
      enum: ["midterm", "oral", "final", "quiz-chapter"],
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Exam must have a duration"],
    },
    openDate: {
      type: Date,
      required: [true, "Exam must have an open date"],
    },
    closeDate: {
      type: Date,
      required: [true, "Exam must have a close date"],
    },
    question: [questionSchema],
  },
  { timestamps: true },
);

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
