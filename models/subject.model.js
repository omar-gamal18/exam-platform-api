const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "provide the subject name"],
    trim: true,
    lowercase: true,
    unique: [true, "this subject is already exist"],
  },
  department: {
    type: "string",
    required: [true, "provide the subject departement"],
    enum: ["cs", "is", "it", "general"],
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    required: [true, "provide the subject year"],
  },
});

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
