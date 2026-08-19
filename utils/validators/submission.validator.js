const { param } = require("express-validator");

const submissionIdParamValidator = [
  param("submissionId")
    .isMongoId()
    .withMessage("Submission ID must be a valid Mongo ID"),
];

module.exports = {
  submissionIdParamValidator,
};
