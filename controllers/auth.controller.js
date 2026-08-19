const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/appError");
const User = require("../models/user.model");

const publicUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT secret is not configured", 500);
  }

  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      algorithm: "HS256",
    },
  );
}

const signup = async (req, res, next) => {
  const { name, email, password, department, year } = req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    department,
    year,
  });

  const token = signToken(user);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: publicUser(user),
    },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Incorrect email or password", 401));
  }

  const token = signToken(user);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: publicUser(user),
    },
  });
};

module.exports = { signup, login };
