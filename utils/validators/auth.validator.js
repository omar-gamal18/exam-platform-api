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
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

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
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

module.exports = {
  signUpValidator,
  loginValidator,
};
