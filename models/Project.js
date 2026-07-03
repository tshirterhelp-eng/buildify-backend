const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  budget: {
    type: Number,
    required: true
  },

  location: {
    type: String,
    required: true
  },

  projectType: {
    type: String,
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  assignedEngineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  contactUnlocked: {
    type: Boolean,
    default: false
  },
  unlockedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
 ],

 customerContact: {
  phone: String,
  email: String
 },

  status: {
    type: String,
    enum: ["open", "in-progress", "completed"],
    default: "open"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

projectSchema.index({ customerId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ projectType: 1 });

module.exports = mongoose.model("Project", projectSchema);