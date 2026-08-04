const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please enter your name"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "please enter your email"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "please enter your password"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "pending_instructor", "instructor", "admin"],
      default: "user",
    },
    department: {
      type: String,
      enum: ["cs", "it", "is", "general"],
      default: "user",
      required: function () {
        return this.role !== "admin";
      },
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
      required: function () {
        return this.role === "student";
      },
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
