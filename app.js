const express = require("express");
const cors = require("cors");

const globalErrorHandler = require("./middlewares/error.middleware");
const ApiError = require("./utils/apiError");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Base Route / Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to the Exam Platform API",
    timestamp: new Date(),
  });
});

// Handling 404
app.use((req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
