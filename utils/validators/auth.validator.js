const { body } = require("express-validator");

const signUpValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters long"),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["cs", "it", "is", "general"])
    .withMessage("Department must be one of: cs, it, is, general"),

  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1, max: 4 })
    .withMessage("Year must be between 1 and 4")
    .toInt(),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters long"),
];

const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email"),
];

const resetPasswordValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters long"),
  body("passwordConfirm")
    .custom((passwordConfirm, { req }) => passwordConfirm === req.body.password)
    .withMessage("Passwords do not match"),
];

module.exports = {
  forgotPasswordValidator,
  resetPasswordValidator,
  signUpValidator,
  loginValidator,
};
