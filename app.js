const express = require("express");
const cors = require("cors");

const authRouter = require("./routers/auth.router");
const errorMiddleware = require("./middlewares/error.middleware");
const ApiError = require("./utils/apiError");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);

app.use((req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);

module.exports = app;
