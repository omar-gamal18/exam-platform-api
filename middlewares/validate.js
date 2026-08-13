const { validationResult } = require("express-validator");
const AppError = require("../utils/appError");

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations in parallel
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Combine error messages
    const messages = errors.array().map((err) => err.msg).join(". ");
    return next(new AppError(messages, 400));
  };
};

module.exports = validate;
