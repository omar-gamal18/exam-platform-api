const Submission = require("../models/submission.model");

const getMySubmissions = async (req, res, next) => {
  const submissions = await Submission.find({ studentId: req.user._id })
    .select("examId totalScore submittedAt")
    .populate({
      path: "examId",
      select: "subject examType",
      populate: {
        path: "subject",
        select: "name",
      },
    })
    .sort({ submittedAt: -1 });

  res.status(200).json({
    status: "success",
    results: submissions.length,
    data: {
      submissions,
    },
  });
};

module.exports = {
  getMySubmissions,
};
