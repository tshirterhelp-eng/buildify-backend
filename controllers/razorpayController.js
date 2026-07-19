const razorpay = require("../config/razorpay");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const Bid = require("../models/Bid");
const asyncHandler = require("../middleware/asyncHandler");

const UNLOCK_AMOUNT_RUPEES = 2500;

// Engineer creates a Razorpay order to unlock contact details.
// Only allowed for the engineer whose bid was accepted on this project.
exports.createOrder = asyncHandler(async (req, res) => {

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  if (
    !project.assignedEngineerId ||
    String(project.assignedEngineerId) !== String(req.user.id)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not the accepted engineer for this project",
    });
  }

  const acceptedBid = await Bid.findOne({
    projectId,
    engineerId: req.user.id,
    status: "accepted",
  });

  if (!acceptedBid) {
    return res.status(403).json({
      success: false,
      message: "No accepted bid found for this project",
    });
  }

  const existingPending = await Payment.findOne({
    projectId,
    engineerId: req.user.id,
    status: "pending",
  });

  // Reuse a still-open order instead of creating duplicates.
  if (existingPending && existingPending.razorpayOrderId) {
    return res.status(200).json({
      success: true,
      orderId: existingPending.razorpayOrderId,
      amount: UNLOCK_AMOUNT_RUPEES * 100,
      keyId: process.env.RAZORPAY_KEY_ID,
      checkoutUrl:
        `${req.protocol}://${req.get("host")}/checkout.html` +
        `?order_id=${existingPending.razorpayOrderId}` +
        `&amount=${UNLOCK_AMOUNT_RUPEES * 100}` +
        `&key=${process.env.RAZORPAY_KEY_ID}`,
    });
  }

  const order = await razorpay.orders.create({
    amount: UNLOCK_AMOUNT_RUPEES * 100, // Razorpay expects paise
    currency: "INR",
    receipt: "BUILDIFY_" + Date.now(),
    notes: {
      projectId: String(projectId),
      engineerId: String(req.user.id),
    },
  });

  await Payment.create({
    engineerId: req.user.id,
    projectId,
    bidId: acceptedBid._id,
    razorpayOrderId: order.id,
    amount: UNLOCK_AMOUNT_RUPEES,
    status: "pending",
  });

  res.status(200).json({
    success: true,
    orderId: order.id,
    amount: order.amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    checkoutUrl:
      `${req.protocol}://${req.get("host")}/checkout.html` +
      `?order_id=${order.id}` +
      `&amount=${order.amount}` +
      `&key=${process.env.RAZORPAY_KEY_ID}`,
  });

});
