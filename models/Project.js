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

  // Land photos, stored as base64 data URIs. Required: 1-5 per project.
  // Excluded from list queries (see projectController) to keep responses small.
  images: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 5,
      message: "A project needs between 1 and 5 land images",
    },
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