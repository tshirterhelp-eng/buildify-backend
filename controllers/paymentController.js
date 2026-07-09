const crypto = require("crypto");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");

// Shared, idempotent "mark this order paid and unlock the project" routine.
async function markOrderPaid(razorpayOrderId, razorpayPaymentId) {
  const payment = await Payment.findOne({ razorpayOrderId });

  if (!payment || payment.status === "completed") {
    return; // Unknown order or already processed — no-op (idempotent).
  }

  payment.status = "completed";
  if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
  await payment.save();

  await Project.findByIdAndUpdate(payment.projectId, {
    $addToSet: { unlockedBy: payment.engineerId },
  });
}

// Called by the hosted checkout page's success handler. The Razorpay
// signature (order_id|payment_id HMAC'd with the key secret) proves the
// payment is genuine, so this route needs no user JWT.
exports.verifyPayment = asyncHandler(async (req, res) => {

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing payment fields" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  await markOrderPaid(razorpay_order_id, razorpay_payment_id);

  res.status(200).json({ success: true });

});

// Server-to-server webhook from Razorpay. Verified via the raw request body
// (captured by the express.json `verify` hook in server.js) HMAC'd with the
// webhook secret. This is the reliable path even if the browser callback fails.
exports.razorpayWebhook = async (req, res) => {
  try {

    const signature = req.headers["x-razorpay-signature"];
    if (!signature) {
      return res.status(400).send("Missing signature");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
      .update(req.rawBody ? req.rawBody.toString() : "")
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;

    if (event === "payment.captured" || event === "order.paid") {
      const entity =
        (req.body.payload &&
          req.body.payload.payment &&
          req.body.payload.payment.entity) ||
        null;

      if (entity) {
        await markOrderPaid(entity.order_id, entity.id);
      }
    }

    res.status(200).send("OK");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

exports.getMyUnlockedProjects = asyncHandler(async (req, res) => {

  const projects = await Project.find({ unlockedBy: req.user.id })
    .select("-customerContact -unlockedBy")
    .sort({ createdAt: -1 })
    .lean();

  // Plain array (not paginated) to match ProjectService.getUnlockedProjects().
  res.status(200).json(projects);

});
