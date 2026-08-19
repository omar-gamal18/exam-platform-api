const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/appError");
const User = require("../models/user.model");

const publicUser = (user) => {
  const safeUser = user.toObject();
  delete safeUser.password;
  return safeUser;
};

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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

const forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  let resetToken;

  if (user) {
    resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
  }

  const data = {
    message: "If an account exists for this email, a reset link has been sent.",
  };
  if (resetToken && process.env.RESET_TOKEN_EXPOSE === "true") {
    data.resetToken = resetToken;
  }

  res.status(200).json({ status: "success", data });
};

const resetPassword = async (req, res, next) => {
  const hashedToken = hashResetToken(req.params.token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    return next(new AppError("Reset token is invalid or has expired", 400));
  }

  user.password = await bcrypt.hash(req.body.password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  const token = signToken(user);
  res.status(200).json({
    status: "success",
    token,
    data: {
      user: publicUser(user),
    },
  });
};

module.exports = { forgotPassword, login, resetPassword, signup };
