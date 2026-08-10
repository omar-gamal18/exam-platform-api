const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const {
  createSubject,
  listAllSubjects,
  updateSubject,
  deleteSubject,
} = require("../controllers/subject.controller");

const router = express.Router();

router.use(authMiddleware.protect);

router.use(authMiddleware.allowedTo("admin"));
router
  .route("/")
  .get(listAllSubjects)
  .post(createSubject)
  .patch(updateSubject)
  .delete(deleteSubject);
