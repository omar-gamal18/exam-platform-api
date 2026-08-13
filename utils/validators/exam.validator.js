const { body, param } = require("express-validator");

const examValidatorRules = [
  body("subjectId")
    .isMongoId()
    .withMessage("Subject ID must be a valid Mongo ID"),

  body("examType")
    .isIn(["midterm", "final", "practical", "quiz-chapter"])
    .withMessage("Exam type must be one of: midterm, final, practical, quiz-chapter"),

  body("opensAt")
    .isISO8601()
    .withMessage("opensAt must be a valid ISO8601 date"),

  body("closesAt")
    .isISO8601()
    .withMessage("closesAt must be a valid ISO8601 date")
    .custom((closesAt, { req }) => {
      if (new Date(closesAt) <= new Date(req.body.opensAt)) {
        throw new Error("closesAt must be after opensAt");
      }
      return true;
    }),

  body("durationMinutes")
    .isInt({ min: 1 })
    .withMessage("durationMinutes must be a positive integer")
    .toInt(),

  body("questions")
    .isArray({ min: 1 })
    .withMessage("questions must be an array with at least 1 question")
    .custom((questions) => {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionLabel = `Question ${i + 1}`;

        if (!q.questionText || typeof q.questionText !== "string" || !q.questionText.trim()) {
          throw new Error(`${questionLabel} must have a non-empty questionText`);
        }

        if (!["mcq", "true_false"].includes(q.type)) {
          throw new Error(`${questionLabel} must have a valid type (mcq or true_false)`);
        }

        if (typeof q.points !== "number" || q.points <= 0) {
          throw new Error(`${questionLabel} must have a positive number for points`);
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`${questionLabel} must have at least 2 options`);
        }

        const optionIds = new Set();
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const optionLabel = `Option ${j + 1} of ${questionLabel}`;

          if (typeof opt.optionId !== "number") {
            throw new Error(`${optionLabel} must have a numeric optionId`);
          }

          if (!opt.text || typeof opt.text !== "string" || !opt.text.trim()) {
            throw new Error(`${optionLabel} must have a non-empty text`);
          }

          if (optionIds.has(opt.optionId)) {
            throw new Error(`${questionLabel} has duplicate optionId: ${opt.optionId}`);
          }
          optionIds.add(opt.optionId);
        }

        if (typeof q.correctOptionId !== "number") {
          throw new Error(`${questionLabel} must have a numeric correctOptionId`);
        }

        if (!optionIds.has(q.correctOptionId)) {
          throw new Error(`${questionLabel}'s correctOptionId (${q.correctOptionId}) does not match any optionId in its options`);
        }
      }
      return true;
    }),
];

const createExamValidator = examValidatorRules;

const updateExamValidator = [
  param("examId")
    .isMongoId()
    .withMessage("Exam ID must be a valid Mongo ID"),

  body("subjectId")
    .optional()
    .isMongoId()
    .withMessage("Subject ID must be a valid Mongo ID"),

  body("examType")
    .optional()
    .isIn(["midterm", "final", "practical", "quiz-chapter"])
    .withMessage("Exam type must be one of: midterm, final, practical, quiz-chapter"),

  body("opensAt")
    .optional()
    .isISO8601()
    .withMessage("opensAt must be a valid ISO8601 date"),

  body("closesAt")
    .optional()
    .isISO8601()
    .withMessage("closesAt must be a valid ISO8601 date")
    .custom((closesAt, { req }) => {
      const opensAt = req.body.opensAt;
      if (opensAt && new Date(closesAt) <= new Date(opensAt)) {
        throw new Error("closesAt must be after opensAt");
      }
      return true;
    }),

  body("durationMinutes")
    .optional()
    .isInt({ min: 1 })
    .withMessage("durationMinutes must be a positive integer")
    .toInt(),

  body("questions")
    .optional()
    .isArray({ min: 1 })
    .withMessage("questions must be an array with at least 1 question")
    .custom((questions) => {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionLabel = `Question ${i + 1}`;

        if (!q.questionText || typeof q.questionText !== "string" || !q.questionText.trim()) {
          throw new Error(`${questionLabel} must have a non-empty questionText`);
        }

        if (!["mcq", "true_false"].includes(q.type)) {
          throw new Error(`${questionLabel} must have a valid type (mcq or true_false)`);
        }

        if (typeof q.points !== "number" || q.points <= 0) {
          throw new Error(`${questionLabel} must have a positive number for points`);
        }

        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error(`${questionLabel} must have at least 2 options`);
        }

        const optionIds = new Set();
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          const optionLabel = `Option ${j + 1} of ${questionLabel}`;

          if (typeof opt.optionId !== "number") {
            throw new Error(`${optionLabel} must have a numeric optionId`);
          }

          if (!opt.text || typeof opt.text !== "string" || !opt.text.trim()) {
            throw new Error(`${optionLabel} must have a non-empty text`);
          }

          if (optionIds.has(opt.optionId)) {
            throw new Error(`${questionLabel} has duplicate optionId: ${opt.optionId}`);
          }
          optionIds.add(opt.optionId);
        }

        if (typeof q.correctOptionId !== "number") {
          throw new Error(`${questionLabel} must have a numeric correctOptionId`);
        }

        if (!optionIds.has(q.correctOptionId)) {
          throw new Error(`${questionLabel}'s correctOptionId (${q.correctOptionId}) does not match any optionId in its options`);
        }
      }
      return true;
    }),
];

const examIdParamValidator = [
  param("examId")
    .isMongoId()
    .withMessage("Exam ID must be a valid Mongo ID"),
];

module.exports = {
  createExamValidator,
  updateExamValidator,
  examIdParamValidator,
};
