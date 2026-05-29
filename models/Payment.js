const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project"
  },

  razorpayOrderId: {
    type: String
  },

  razorpayPaymentId: {
    type: String
  },

  status: {
    type: String,
    default: "pending"
  },

  amount: {
    type: Number,
    default: 2500
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Payment", paymentSchema);