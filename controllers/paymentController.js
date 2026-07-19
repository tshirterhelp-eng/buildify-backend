const crypto = require("crypto");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");

// Cashfree signs webhooks as base64(HMAC-SHA256(timestamp + rawBody, clientSecret)),
// sent in the `x-webhook-signature` header alongside `x-webhook-timestamp`.
// This must run against the raw request bytes (see server.js's express.json
// `verify` hook) — re-stringifying the parsed body can differ from what
// Cashfree actually signed and would break verification.
exports.cashfreeWebhook = async (req, res) => {
  try {

    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      return res.status(400).send("Missing signature headers");
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - Number(timestamp)) > 300) {
      return res.status(400).send("Stale webhook timestamp");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET || "")
      .update(timestamp + (req.rawBody ? req.rawBody.toString() : ""))
      .digest("base64");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const data = req.body.data;

    if (data && data.payment && data.payment.payment_status === "SUCCESS") {

      const orderId = data.order.order_id;
      const paymentId = data.payment.cf_payment_id;

      const payment = await Payment.findOne({ cashfreeOrderId: orderId });

      // Idempotency: a replayed webhook for an already-completed payment is a no-op.
      if (payment && payment.status === "pending") {
        payment.status = "completed";
        payment.cashfreePaymentId = paymentId;
        await payment.save();

        await Project.findByIdAndUpdate(payment.projectId, {
          $addToSet: { unlockedBy: payment.engineerId },
        });
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
    .select("-customerContact -unlockedBy -images")
    .sort({ createdAt: -1 })
    .lean();

  // Plain array (not paginated) to match ProjectService.getUnlockedProjects().
  res.status(200).json(projects);

});
