const express = require("express");
const cors = require("cors");

const authRouter = require("./routers/auth.router");
const userRouter = require("./routers/user.router");
const subjectRouter = require("./routers/subject.routes");
const adminRouter = require("./routers/admin.router");
const errorMiddleware = require("./middlewares/error.middleware");
const AppError = require("./utils/appError");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subjects", subjectRouter);
app.use("/api/v1/admin", adminRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorMiddleware);

module.exports = app;
