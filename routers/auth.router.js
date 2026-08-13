const express = require("express");

const { signup, login } = require("../controllers/auth.controller");
const {
  signUpValidator,
  loginValidator,
} = require("../utils/validators/auth.validator");
const validate = require("../middlewares/validate");

const router = express.Router();

router.post("/signup", validate(signUpValidator), signup);
router.post("/register", validate(signUpValidator), signup);
router.post("/login", validate(loginValidator), login);

module.exports = router;
