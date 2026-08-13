const express = require("express");
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const {
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

// Apply auth protection & restrict to admin
router.use(protect);
router.use(allowedTo("admin"));

// Route to get all pending instructor requests
router.get("/instructor-requests", listPendingInstructors);

// Route to approve instructor request
router.patch(
  "/instructor-requests/:userId/approve",
  validate(approveInstructorValidator),
  approveInstructor
);

// Route to reject instructor request
router.patch(
  "/instructor-requests/:userId/reject",
  validate(rejectInstructorValidator),
  rejectInstructor
);

// Route to assign subjects to instructor
router.patch(
  "/users/:userId/subjects",
  validate(assignSubjectsValidator),
  assignSubjectsToInstructor
);

module.exports = router;
