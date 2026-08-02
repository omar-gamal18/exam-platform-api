const mongoose = require("mongoose");
const dns = require("dns");

// Force Node to use Google's public DNS resolvers.
// Fixes "querySrv ECONNREFUSED" caused by unreliable system DNS
// (common on WSL, Docker, some ISPs/VPNs).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
