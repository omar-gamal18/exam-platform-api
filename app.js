const express = require("express");
const cors = require("cors");

const authRouter = require("./routers/auth.router");
const instructorRequestRouter = require("./routers/instructorRequest.router");
const errorMiddleware = require("./middlewares/error.middleware");
const AppError = require("./utils/appError");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/instructorRequest", instructorRequestRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);

module.exports = app;
