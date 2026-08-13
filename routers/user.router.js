const express = require("express");

const { getMe } = require("../controllers/user.controller");
const {
  requestInstructor,
} = require("../controllers/instructorRequest.controller");

const { allowedTo, protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/me", getMe);
router.patch("/request-instructor", allowedTo("student"), requestInstructor);

module.exports = router;
