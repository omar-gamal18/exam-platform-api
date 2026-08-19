const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");
const {
  getMySubmissionDetail,
  getMySubmissions,
} = require("../controllers/submission.controller");
const validate = require("../middlewares/validate");
const {
  submissionIdParamValidator,
} = require("../utils/validators/submission.validator");

const router = express.Router();

router.use(protect);
router.get("/mine", allowedTo("student"), getMySubmissions);
router.get(
  "/:submissionId",
  allowedTo("student"),
  validate(submissionIdParamValidator),
  getMySubmissionDetail,
);

module.exports = router;
