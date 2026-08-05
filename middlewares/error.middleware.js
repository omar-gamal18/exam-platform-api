const AppError = require("../utils/appError");

function handleValidationError(err) {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Invalid input data: ${messages.join(". ")}`, 400);
}

function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue || {}).join(", ");
  return new AppError(`Duplicate value for field: ${field}`, 409);
}

function handleJwtError() {
  return new AppError("Invalid token. Please log in again.", 401);
}

function handleJwtExpiredError() {
  return new AppError("Your token has expired. Please log in again.", 401);
}

module.exports = function errorMiddleware(err, req, res, next) {
  let error = err;
  error.statusCode = error.statusCode || 500;

  if (error.name === "ValidationError") error = handleValidationError(error);
  if (error.code === 11000) error = handleDuplicateKeyError(error);
  if (error.name === "JsonWebTokenError") error = handleJwtError();
  if (error.name === "TokenExpiredError") error = handleJwtExpiredError();

  if (!error.isOperational) {
    console.error("UNEXPECTED ERROR 💥", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};
