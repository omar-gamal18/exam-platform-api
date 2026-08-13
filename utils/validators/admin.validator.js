const { body, param } = require("express-validator");

const approveInstructorValidator = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid Mongo ID"),
];

const rejectInstructorValidator = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid Mongo ID"),
];

const assignSubjectsValidator = [
  param("userId")
    .isMongoId()
    .withMessage("User ID must be a valid Mongo ID"),

  body("subjects")
    .isArray()
    .withMessage("Subjects must be an array")
    .custom((subjects) => {
      for (const id of subjects) {
        if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
          throw new Error(`Subject ID '${id}' is not a valid Mongo ID`);
        }
      }
      return true;
    }),
];

module.exports = {
  approveInstructorValidator,
  rejectInstructorValidator,
  assignSubjectsValidator,
};
