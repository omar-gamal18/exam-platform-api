const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");

const {
  createExam,
  deleteExam,
  getAvailableExams,
  getExamById,
  getExamForStudent,
  getMyExams,
  startExam,
  submitExam,
  updateExam,
} = require("../controllers/exam.controller");

const validate = require("../middlewares/validate");

const {
  createExamValidator,
  examIdParamValidator,
  submitExamValidator,
  updateExamValidator,
} = require("../utils/validators/exam.validator");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  allowedTo("instructor"),
  validate(createExamValidator),
  createExam,
);
router.get("/mine", allowedTo("instructor"), getMyExams);
router.get("/available", allowedTo("student"), getAvailableExams);
router.post(
  "/:examId/start",
  allowedTo("student"),
  validate(examIdParamValidator),
  startExam,
);
router.post(
  "/:examId/submit",
  allowedTo("student"),
  validate(submitExamValidator),
  submitExam,
);
router.get(
  "/:examId/for-student",
  allowedTo("student"),
  validate(examIdParamValidator),
  getExamForStudent,
);
router.get(
  "/:examId",
  allowedTo("instructor", "admin"),
  validate(examIdParamValidator),
  getExamById,
);
router.patch(
  "/:examId",
  allowedTo("instructor"),
  validate(updateExamValidator),
  updateExam,
);
router.delete(
  "/:examId",
  allowedTo("admin"),
  validate(examIdParamValidator),
  deleteExam,
);

module.exports = router;
