const express = require("express");

const { protect, allowedTo } = require("../middlewares/auth.middleware");
const { getMySubmissions } = require("../controllers/submission.controller");

const router = express.Router();

router.use(protect);
router.get("/mine", allowedTo("student"), getMySubmissions);

module.exports = router;
