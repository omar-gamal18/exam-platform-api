const Exam = require("../models/exam.model");
const ExamAttempt = require("../models/examAttempt.model");
const Submission = require("../models/submission.model");
const Subject = require("../models/subject.model");
const AppError = require("../utils/appError");

const isAssignedSubject = (user, subjectId) =>
  user.subjects?.some((subject) => subject.toString() === subjectId.toString());

const buildQuestions = (questions) =>
  questions.map((question, questionIndex) => {
    const optionIds = new Map();
    const options = question.options.map((option, optionIndex) => {
      const optionId = optionIndex + 1;
      optionIds.set(option.optionId, optionId);
      return { optionId, text: option.text };
    });

    return {
      questionId: questionIndex + 1,
      questionText: question.questionText,
      questionType: question.type,
      points: question.points,
      options,
      correctOptionId: optionIds.get(question.correctOptionId),
    };
  });

const findExam = async (examId) => {
  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError("Exam not found", 404);
  }
  return exam;
};

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

  if (!isAssignedSubject(req.user, subjectId)) {
    return next(
      new AppError(
        "This subject is not assigned to you. Contact admin to assign this subject.",
        403,
      ),
    );
  }

  const exam = await Exam.create({
    instructor: req.user._id,
    subject: subjectId,
    department: subject.department,
    year: subject.year,
    examType,
    durationMinutes,
    opensAt: new Date(opensAt),
    closesAt: new Date(closesAt),
    question: buildQuestions(questions),
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

const getExamById = async (req, res, next) => {
  const exam = await findExam(req.params.examId);
  const isOwner = exam.instructor.toString() === req.user._id.toString();

  if (req.user.role !== "admin" && !isOwner) {
    return next(new AppError("You are not authorized to view this exam", 403));
  }

  await exam.populate("subject", "name department year");
  res.status(200).json({ status: "success", data: { exam } });
};

const getExamForStudent = async (req, res, next) => {
  const exam = await findExam(req.params.examId);
  const now = new Date();

  if (
    exam.year !== req.user.year ||
    !exam.department.includes(req.user.department) ||
    now < exam.opensAt ||
    now > exam.closesAt
  ) {
    return next(new AppError("This exam is not available to you", 403));
  }

  const examForStudent = exam.toObject();
  examForStudent.question = examForStudent.question
    .map((question) => ({
      ...question,
      options: question.options.sort(() => Math.random() - 0.5),
    }))
    .sort(() => Math.random() - 0.5)
    .map(({ correctOptionId, ...question }) => question);

  res.status(200).json({
    status: "success",
    data: { exam: examForStudent },
  });
};

const startExam = async (req, res, next) => {
  const exam = await findExam(req.params.examId);
  const now = new Date();

  if (now < exam.opensAt || now > exam.closesAt) {
    return next(new AppError("This exam is not currently open", 400));
  }

  if (
    exam.year !== req.user.year ||
    !exam.department.includes(req.user.department)
  ) {
    return next(new AppError("This exam is not available to you", 403));
  }

  try {
    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: req.user._id,
    });

    res.status(201).json({
      status: "success",
      data: {
        attempt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("You have already started this exam", 409));
    }
    next(error);
  }
};

const submitExam = async (req, res, next) => {
  const exam = await findExam(req.params.examId);
  const attempt = await ExamAttempt.findOne({
    examId: exam._id,
    studentId: req.user._id,
  });

  if (!attempt) {
    return next(
      new AppError("You must start this exam before submitting", 400),
    );
  }

  const deadline = new Date(
    Math.min(
      attempt.startedAt.getTime() + exam.durationMinutes * 60 * 1000,
      exam.closesAt.getTime(),
    ),
  );
  if (new Date() > deadline) {
    return next(new AppError("The submission deadline has passed", 400));
  }

  const answersByQuestionId = new Map();
  for (const answer of req.body.answers) {
    if (answersByQuestionId.has(answer.questionId)) {
      return next(new AppError("Each question can only be answered once", 400));
    }
    answersByQuestionId.set(answer.questionId, answer.selectedOptionId);
  }

  if (answersByQuestionId.size !== exam.question.length) {
    return next(new AppError("You must answer every question", 400));
  }

  const gradedAnswers = [];
  let totalScore = 0;
  for (const question of exam.question) {
    const selectedOptionId = answersByQuestionId.get(question.questionId);
    if (selectedOptionId === undefined) {
      return next(new AppError("Answer contains an unknown question", 400));
    }

    if (
      !question.options.some((option) => option.optionId === selectedOptionId)
    ) {
      return next(new AppError("Answer contains an invalid option", 400));
    }

    const isCorrect = selectedOptionId === question.correctOptionId;
    const pointsEarned = isCorrect ? question.points : 0;
    totalScore += pointsEarned;
    gradedAnswers.push({
      questionId: question.questionId,
      selectedOptionId,
      isCorrect,
      pointsEarned,
    });
  }

  try {
    const submission = await Submission.create({
      examId: exam._id,
      studentId: req.user._id,
      answers: gradedAnswers,
      totalScore,
    });

    res.status(201).json({ status: "success", data: { submission } });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("You have already submitted this exam", 409));
    }
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  const exam = await findExam(req.params.examId);

  if (exam.instructor.toString() !== req.user._id.toString()) {
    return next(
      new AppError("You are not authorized to update this exam", 403),
    );
  }
  if (new Date() >= exam.opensAt) {
    return next(new AppError("An exam cannot be updated after it opens", 400));
  }

  const allowedFields = ["examType", "durationMinutes", "opensAt", "closesAt"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) exam[field] = req.body[field];
  });

  if (req.body.subjectId !== undefined) {
    const subject = await Subject.findById(req.body.subjectId);
    if (!subject) return next(new AppError("Subject not found", 404));
    if (!isAssignedSubject(req.user, req.body.subjectId)) {
      return next(new AppError("This subject is not assigned to you", 403));
    }
    exam.subject = subject._id;
    exam.department = subject.department;
    exam.year = subject.year;
  }
  if (req.body.questions !== undefined) {
    exam.question = buildQuestions(req.body.questions);
  }

  await exam.save();
  res.status(200).json({ status: "success", data: { exam } });
};

const deleteExam = async (req, res, next) => {
  const exam = await findExam(req.params.examId);
  await exam.deleteOne();
  res.status(204).send();
};

module.exports = {
  deleteExam,
  getExamById,
  getExamForStudent,
  getAvailableExams,
  getMyExams,
  createExam,
  startExam,
  submitExam,
  updateExam,
};
