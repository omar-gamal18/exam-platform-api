const { param } = require("express-validator");

const submissionIdParamValidator = [
  param("submissionId")
    .isMongoId()
    .withMessage("Submission ID must be a valid Mongo ID"),
];

const examStudentParamValidator = [
  param("examId").isMongoId().withMessage("Exam ID must be a valid Mongo ID"),
  param("studentId")
    .isMongoId()
    .withMessage("Student ID must be a valid Mongo ID"),
];

module.exports = {
  examStudentParamValidator,
  submissionIdParamValidator,
};
