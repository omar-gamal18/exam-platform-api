const AppError = require("../utils/appError");
const User = require("../models/user.model");

const getMe = (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
};

const requestInstructor = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id });

  user.role = "pending_instructor";

  await user.save();

  res.status(200).json({
    status: "success",
    message: "your request sent to an admin wait for response...",
  });
};

module.exports = {
  requestInstructor,
  getMe,
};
