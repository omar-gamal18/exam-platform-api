require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });

  process.on("uncaughtException", (error) => {
    console.error(`Uncaught Exception: ${error.name} ${error.message}`);
    server.close(() => process.exit(1));
  });

  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.name} ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
};

startServer().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
