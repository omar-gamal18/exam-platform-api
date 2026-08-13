const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");

const {
  createSubject,
  listAllSubjects,
  updateSubject,
  deleteSubject,
  getMySubjects,
} = require("../controllers/subject.controller");

const validate = require("../middlewares/validate");

const {
  createSubjectValidator,
  updateSubjectValidator,
  deleteSubjectValidator,
} = require("../utils/validators/subject.validator");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/mine", authMiddleware.allowedTo("instructor"), getMySubjects);

router.use(authMiddleware.allowedTo("admin"));

router
  .route("/")
  .get(listAllSubjects)
  .post(validate(createSubjectValidator), createSubject);

router
  .route("/:id")
  .patch(validate(updateSubjectValidator), updateSubject)
  .delete(validate(deleteSubjectValidator), deleteSubject);

module.exports = router;
