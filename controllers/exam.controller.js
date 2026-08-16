const Exam = require("../models/exam.model");
const Subject = require("../models/subject.model");
const AppError = require("../utils/appError");

const getMyExams = async (req, res, next) => {
  const exams = await Exam.find({ instructor: req.user._id });
  res.status(200).json({
    status: "success",
    results: exams.length,
    data: {
      exams,
    },
  });
};

module.exports = {
  createExam,
  getMyExams,
};
