const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({}, { timestamps: true });

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
