const express = require("express");

const {
  requestInstructor,
  listPendingInstructors,
  approveInstructor,
  rejectInstructor,
} = require("../controllers/instructorRequest.controller");
const { protect, allowedTo } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", allowedTo("admin"), listPendingInstructors);
router.post("/", allowedTo("student"), requestInstructor);

module.exports = router;
