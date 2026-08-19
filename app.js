const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const apiRouter = require("./routers");
const errorMiddleware = require("./middlewares/error.middleware");
const AppError = require("./utils/appError");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new AppError("Origin is not allowed", 403));
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(hpp());
app.use(
  "/api/v1",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      status: "fail",
      message: "Too many requests. Please try again later.",
    },
  }),
);

app.use("/api/v1", apiRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);

module.exports = app;
