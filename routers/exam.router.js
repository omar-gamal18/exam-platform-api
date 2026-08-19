const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");

const {
  createExam,
  deleteExam,
  getAvailableExams,
  getExamById,
  getExamForStudent,
  getMyExams,
  updateExam,
} = require("../controllers/exam.controller");

const validate = require("../middlewares/validate");

const {
  createExamValidator,
  examIdParamValidator,
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
