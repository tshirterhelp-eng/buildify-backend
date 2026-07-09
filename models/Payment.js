const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  engineerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  bidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bid",
    required: true
  },

  razorpayOrderId: {
    type: String
  },

  razorpayPaymentId: {
    type: String
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
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

paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ projectId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
