const { body } = require("express-validator");

const signUpValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("department").notEmpty().withMessage("Department is required"),
  body("year").notEmpty().withMessage("Year is required"),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  signUpValidator,
  loginValidator,
};
