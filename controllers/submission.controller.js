const Exam = require("../models/exam.model");
const Submission = require("../models/submission.model");
const AppError = require("../utils/appError");

const buildQuestionBreakdown = (submission) => {
  const submissionAnswers = new Map(
    submission.answers.map((answer) => [answer.questionId, answer]),
  );

  return submission.examId.question.map((question) => {
    const answer = submissionAnswers.get(question.questionId);
    const selectedOption = question.options.find(
      (option) => option.optionId === answer.selectedOptionId,
    );
    const correctOption = question.options.find(
      (option) => option.optionId === question.correctOptionId,
    );

    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      points: question.points,
      selectedOptionId: answer.selectedOptionId,
      selectedAnswer: selectedOption.text,
      isCorrect: answer.isCorrect,
      pointsEarned: answer.pointsEarned,
      correctOptionId: question.correctOptionId,
      correctAnswer: correctOption.text,
    };
  });
};

const getMySubmissions = async (req, res, next) => {
  const submissions = await Submission.find({ studentId: req.user._id })
    .select("examId totalScore submittedAt")
    .populate({
      path: "examId",
      select: "subject examType",
      populate: {
        path: "subject",
        select: "name",
      },
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
};

const getMySubmissionDetail = async (req, res, next) => {
  const submission = await Submission.findOne({
    _id: req.params.submissionId,
    studentId: req.user._id,
  }).populate({
    path: "examId",
    select: "subject examType question",
    populate: {
      path: "subject",
      select: "name department year",
    },
  });

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  const questionBreakdown = buildQuestionBreakdown(submission);

  res.status(200).json({
    status: "success",
    data: {
      submission,
      questionBreakdown,
    },
  });
};

const getExamSubmissions = async (req, res, next) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    return next(new AppError("Exam not found", 404));
  }

  const isOwner = exam.instructor.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    return next(
      new AppError("You are not authorized to view these submissions", 403),
    );
  }

  const submissions = await Submission.find({ examId: exam._id })
    .select("studentId totalScore submittedAt")
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
};

const getStudentSubmissionDetail = async (req, res, next) => {
  const exam = await Exam.findById(req.params.examId).select("instructor");
  if (!exam) {
    return next(new AppError("Exam not found", 404));
  }

  const isOwner = exam.instructor.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    return next(
      new AppError("You are not authorized to view these submissions", 403),
    );
  }

  const submission = await Submission.findOne({
    examId: req.params.examId,
    studentId: req.params.studentId,
  })
    .populate({
      path: "examId",
      select: "subject examType question",
      populate: {
        path: "subject",
        select: "name department year",
      },
    })
    .populate("studentId", "name email");

  if (!submission) {
    return next(new AppError("Submission not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      submission,
      questionBreakdown: buildQuestionBreakdown(submission),
    },
  });
};

module.exports = {
  getExamSubmissions,
  getMySubmissions,
  getMySubmissionDetail,
  getStudentSubmissionDetail,
};
