const express = require("express");

const { getMe } = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { route } = require("./auth.router");

const router = express.Router();

router.use(authMiddleware.protect);

router.get("/me", getMe);

module.exports = router;
