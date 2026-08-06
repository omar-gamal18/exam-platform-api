const AppError = require("../utils/appError");
const User = require("../models/user.model");

const requestInstructor = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });

  user.role = "pending_instructor";

  await user.save();

  res.status(200).json({
    status: "success",
    message: "your request sent to an admin wait for response...",
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

  const user = await User.findOne({ _id: userId });

  user.role = "instructor";

  await user.save();

  res.status(200).json({
    status: "success",
    message: `your request accepted your role now is: ${user.role}`,
  });
};

const rejectInstructor = async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findOne({ _id: userId });

  user.role = "student";

  await user.save();

  res.status(200).json({
    status: "success",
    message: `your request rejected your role now is: ${user.role}`,
  });
};

module.exports = {
  requestInstructor,
  listPendingInstructors,
  approveInstructor,
  rejectInstructor,
};
