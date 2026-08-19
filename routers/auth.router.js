const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  forgotPassword,
  login,
  resetPassword,
  signup,
} = require("../controllers/auth.controller");
const {
  forgotPasswordValidator,
  signUpValidator,
  loginValidator,
  resetPasswordValidator,
} = require("../utils/validators/auth.validator");
const validate = require("../middlewares/validate");

const router = express.Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many authentication attempts. Please try again later.",
  },
});

router.post("/signup", authRateLimit, validate(signUpValidator), signup);
router.post("/login", authRateLimit, validate(loginValidator), login);
router.post(
  "/forgot-password",
  authRateLimit,
  validate(forgotPasswordValidator),
  forgotPassword,
);
router.patch(
  "/reset-password/:token",
  authRateLimit,
  validate(resetPasswordValidator),
  resetPassword,
);

module.exports = router;
