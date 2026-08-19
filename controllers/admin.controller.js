const AppError = require("../utils/appError");
const Exam = require("../models/exam.model");
const User = require("../models/user.model");
const Subject = require("../models/subject.model");

const getAllExams = async (req, res, next) => {
  const exams = await Exam.find()
    .populate("subject", "name department year")
    .populate("instructor", "name email")
    .sort({ opensAt: 1 });

  res.status(200).json({
    status: "success",
    results: exams.length,
    data: {
      exams,
    },
  });
};

const listPendingInstructors = async (req, res, next) => {
  const users = await User.find({ role: "pending_instructor" });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
};

const approveInstructor = async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  if (user.role !== "pending_instructor") {
    return next(
      new AppError("User is not currently a pending instructor.", 400),
    );
  }

  user.role = "instructor";
  await user.save();

  res.status(200).json({
    status: "success",
    message: `your request accepted your role now is: ${user.role}`,
  });
};

const rejectInstructor = async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  if (user.role !== "pending_instructor") {
    return next(
      new AppError("User is not currently a pending instructor.", 400),
    );
  }

  user.role = "student";
  await user.save();

  res.status(200).json({
    status: "success",
    message: `your request rejected your role now is: ${user.role}`,
  });
};

const assignSubjectsToInstructor = async (req, res, next) => {
  const { userId } = req.params;
  const { subjects } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  if (user.role !== "instructor") {
    return next(new AppError("This Route Is Only For Instructors ", 404));
  }

  const foundSubjects = await Subject.find({
    _id: { $in: subjects },
  }).select("_id");

  if (foundSubjects.length !== subjects.length) {
    return next(new AppError("One or more subjects do not exist.", 400));
  }

  user.subjects = subjects;

  await user.save();

  await user.populate("subjects");

  res.status(200).json({
    status: "success",
    data: {
      user: await user.populate("subjects"),
    },
  });
};

module.exports = {
  getAllExams,
  listPendingInstructors,
  approveInstructor,
  rejectInstructor,
  assignSubjectsToInstructor,
};
