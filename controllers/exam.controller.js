const Exam = require("../models/exam.model");

const getAllExams = async (req, res, next) => {
  const exams = await Exam.find();
  res.status(200).json({
    status: "success",
    results: exams.length,
    data: {
      exams,
    },
  });
};

const createExam = async (req, res, next) => {
  const newExam = await Exam.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      newExam,
    },
  });
};

const getExamById = async (req, res, next) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      status: "fail",
      message: "Exam not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      exam,
    },
  });
};

const updateExamById = async (req, res, next) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!exam) {
    return res.status(404).json({
      status: "fail",
      message: "Exam not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      exam,
    },
  });
};

const deleteExamById = async (req, res, next) => {
  const exam = await Exam.findByIdAndDelete(req.params.id);

  if (!exam) {
    return res.status(404).json({
      status: "fail",
      message: "Exam not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      exam,
    },
  });
};

module.exports = {
  getAllExams,
  createExam,
  getExamById,
  updateExamById,
  deleteExamById,
};
