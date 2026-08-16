const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");

const { getMyExams } = require("../controllers/exam.controller");

const validate = require("../middlewares/validate");

const {} = require("../utils/validators/exam.validator");

const router = express.Router();

router.use(protect);

router.get("/my-exams", allowedTo("instructor"), getMyExams);

module.exports = router;
