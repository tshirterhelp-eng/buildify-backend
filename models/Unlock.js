const mongoose = require("mongoose");

const unlockSchema = new mongoose.Schema({
  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  paymentId: String,
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.model("Unlock", unlockSchema);
