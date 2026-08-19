const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");

const {
  getAllExams,
  getAllSubmissions,
  listPendingInstructors,
  approveInstructor,
  rejectInstructor,
  assignSubjectsToInstructor,
} = require("../controllers/admin.controller");

const validate = require("../middlewares/validate");

const {
  approveInstructorValidator,
  rejectInstructorValidator,
  assignSubjectsValidator,
} = require("../utils/validators/admin.validator");

const router = express.Router();

router.use(protect, allowedTo("admin"));

router.get("/exams", getAllExams);
router.get("/submissions", getAllSubmissions);
router.get("/instructor-requests", listPendingInstructors);

router.patch(
  "/instructor-requests/:userId/approve",
  validate(approveInstructorValidator),
  approveInstructor,
);

router.patch(
  "/instructor-requests/:userId/reject",
  validate(rejectInstructorValidator),
  rejectInstructor,
);

router.patch(
  "/users/:userId/subjects",
  validate(assignSubjectsValidator),
  assignSubjectsToInstructor,
);

module.exports = router;
