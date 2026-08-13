const express = require("express");

const { getMe } = require("../controllers/user.controller");
const { requestInstructor } = require("../controllers/instructorRequest.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/me", getMe);
router.patch("/request-instructor", authMiddleware.allowedTo("student"), requestInstructor);

module.exports = router;
