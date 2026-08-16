const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");

const { getMyExams, createExam } = require("../controllers/exam.controller");

const validate = require("../middlewares/validate");

const { createExamValidator } = require("../utils/validators/exam.validator");

const router = express.Router();

router.use(protect);

router.post(
  "/create-exam",
  allowedTo("instructor"),
  validate(createExamValidator),
  createExam,
);
router.get("/my-exams", allowedTo("instructor"), getMyExams);

module.exports = router;
