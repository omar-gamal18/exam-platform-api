require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.name} ${err.message}`);

  server.close(() => process.exit(1));
});
