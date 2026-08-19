const Submission = require("../models/submission.model");
const AppError = require("../utils/appError");

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

  const submissionAnswers = new Map(
    submission.answers.map((answer) => [answer.questionId, answer]),
  );
  const questionBreakdown = submission.examId.question.map((question) => {
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

  res.status(200).json({
    status: "success",
    data: {
      submission,
      questionBreakdown,
    },
  });
};

module.exports = {
  getMySubmissions,
  getMySubmissionDetail,
};
