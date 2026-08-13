const { body, param } = require("express-validator");

const createSubjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Subject name is required"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .customSanitizer((value) => {
      if (typeof value === "string") return [value];
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("Department must be a non-empty array or string")
    .custom((dept) => {
      const allowed = ["cs", "it", "is", "general"];
      for (const d of dept) {
        if (!allowed.includes(d)) {
          throw new Error(`Department '${d}' is invalid. Allowed: cs, it, is, general`);
        }
      }
      return true;
    }),

  body("year")
    .notEmpty()
    .withMessage("Year is required")
    .isInt({ min: 1, max: 4 })
    .withMessage("Year must be between 1 and 4")
    .toInt(),
];

const updateSubjectValidator = [
  param("id")
    .isMongoId()
    .withMessage("Subject ID must be a valid Mongo ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Subject name cannot be empty"),

  body("department")
    .optional()
    .customSanitizer((value) => {
      if (typeof value === "string") return [value];
      return value;
    })
    .isArray({ min: 1 })
    .withMessage("Department must be a non-empty array or string")
    .custom((dept) => {
      const allowed = ["cs", "it", "is", "general"];
      for (const d of dept) {
        if (!allowed.includes(d)) {
          throw new Error(`Department '${d}' is invalid. Allowed: cs, it, is, general`);
        }
      }
      return true;
    }),

  body("year")
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage("Year must be between 1 and 4")
    .toInt(),
];

const deleteSubjectValidator = [
  param("id")
    .isMongoId()
    .withMessage("Subject ID must be a valid Mongo ID"),
];

module.exports = {
  createSubjectValidator,
  updateSubjectValidator,
  deleteSubjectValidator,
};
