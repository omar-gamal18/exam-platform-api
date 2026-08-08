const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: Number,
    questionText: {
      type: String,
      required: [true, "provide the question text please"],
      questionType: {
        type: String,
        enum: ["mcq", "true_false"],
      },
      points: {
        type: Number,
        min: 1,
        max: 2,
      },
    },
    options: [
      {
        optionId: Number,
        text: {
          type: String,
          required: [true, "provide the quetion text"],
        },
      },
    ],
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
    },

    duration: {
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
