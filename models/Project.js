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

module.exports = mongoose.model("Project", projectSchema);