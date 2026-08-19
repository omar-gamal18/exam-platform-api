const express = require("express");

const authRouter = require("./auth.router");
const userRouter = require("./user.router");
const examRouter = require("./exam.router");
const subjectRouter = require("./subject.routes");
const adminRouter = require("./admin.router");
const submissionRouter = require("./submission.router");

const router = express.Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/exams", examRouter);
router.use("/subjects", subjectRouter);
router.use("/admin", adminRouter);
router.use("/submissions", submissionRouter);

module.exports = router;
