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
      enum: ["student", "pending_instructor", "instructor", "admin"],
      default: "student",
    },
    department: {
      type: String,
      enum: ["cs", "it", "is", "general"],
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

    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
