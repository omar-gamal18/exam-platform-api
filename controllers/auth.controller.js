const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");
const User = require("../models/user.model");

const signUp = async (req, res, next) => {
  const { name, email, password, department, year } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role: "user",
    department,
    year,
  });

  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ApiError("Invalid email or password", 401));
  }

  res.status(200).json({
    status: "success",
    token,
  });
};
