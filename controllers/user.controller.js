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

module.exports = { getMe };
