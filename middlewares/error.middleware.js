const AppError = require("../utils/appError");

const handleCastErrorDb = (err) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join(" ");
  const message = `Invalid input data. ${errors}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDb = (err) => {
  const fields = Object.keys(err.keyValue || {}).join(", ") || "field";
  const message = `Duplicate value for ${fields}. Please use another value!`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError("Invalid or expired token", 401);

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong on the server.",
    });
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.type === "entity.parse.failed") {
    err = new AppError("Malformed JSON request body", 400);
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };

    if (error.name === "CastError") error = handleCastErrorDb(error);
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      error = handleJwtError();
    }
    if (error.code === 11000) error = handleDuplicateFieldsDb(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDb(error);

    sendErrorProd(error, res);
  }
};
