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

const createExam = async (req, res, next) => {
  const { subjectId, examType, durationMinutes, opensAt, closesAt, questions } =
    req.body;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return next(new AppError("Subject not found", 404));
  }

  const isSubjectAssigned = req.user.subjects.some(
    (s) => s.toString() === subjectId,
  );
  if (!isSubjectAssigned) {
    return next(
      new AppError(
        "This subject is not assigned to you. Contact admin to assign this subject.",
        403,
      ),
    );
  }

  const processedQuestions = questions.map((question, questionIndex) => {
    const oldToNewOptionIdMap = {};

    const processedOptions = question.options.map((option, optionIndex) => {
      const newOptionId = optionIndex + 1;
      oldToNewOptionIdMap[option.optionId] = newOptionId;
      return {
        optionId: newOptionId,
        text: option.text,
      };
    });

    const newCorrectOptionId = oldToNewOptionIdMap[question.correctOptionId];

    return {
      questionId: questionIndex + 1,
      questionText: question.questionText,
      questionType: question.type || question.questionType,
      points: question.points,
      options: processedOptions,
      correctOptionId: newCorrectOptionId,
    };
  });

  const exam = await Exam.create({
    instructor: req.user._id,
    subject: subjectId,
    department: subject.department,
    year: subject.year,
    examType,
    durationMinutes,
    opensAt: new Date(opensAt),
    closesAt: new Date(closesAt),
    question: processedQuestions,
  });

  res.status(201).json({
    status: "success",
    data: {
      exam,
    },
  });
};

const getAvailableExams = async (req, res, next) => {
  const now = new Date();

  const exams = await Exam.find({
    department: req.user.department,
    year: req.user.year,
    opensAt: { $lte: now },
    closesAt: { $gte: now },
  })
    .select("-question.correctOptionId")
    .populate("subject", "name")
    .populate("instructor", "name")
    .sort({ opensAt: 1 });

  res.status(200).json({
    status: "success",
    results: exams.length,
    data: {
      exams,
    },
  });
};

module.exports = {
  getAvailableExams,
  getMyExams,
  createExam,
};
