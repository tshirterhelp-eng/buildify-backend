const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  estimatedTimeline: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "withdrawn"],
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

bidSchema.index({ projectId: 1, engineerId: 1 }, { unique: true });
bidSchema.index({ projectId: 1 });
bidSchema.index({ engineerId: 1 });

module.exports = mongoose.model("Bid", bidSchema);
