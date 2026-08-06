const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Exam must belong to an instructor"],
    },
    title: {
      type: String,
      required: [true, "Exam must have a title"],
    },
    openDate: {
      type: Date,
      required: [true, "Exam must have an open date"],
    },
    closeDate: {
      type: Date,
      required: [true, "Exam must have a close date"],
    },
    duration: {
      type: Number,
      required: [true, "Exam must have a duration"],
    },
  },
  { timestamps: true },
);

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
