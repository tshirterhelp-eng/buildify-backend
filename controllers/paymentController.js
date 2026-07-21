const crypto = require("crypto");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");
const { markPaid, reconcilePendingPayment } = require("../utils/paymentUnlock");

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

      // markPaid is idempotent — a replayed webhook is a no-op.
      await markPaid(payment, paymentId);
    }

    res.status(200).send("OK");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
};

// Landing page Cashfree redirects the browser to after payment. It confirms
// the payment server-side (so the contact is already unlocked by the time the
// app reopens), then bounces into the app via the buildify:// deep link. No
// app change is needed — the app already listens for buildify://payment-success.
exports.paymentReturn = asyncHandler(async (req, res) => {

  const orderId = req.query.order_id;

  if (orderId) {
    const payment = await Payment.findOne({ cashfreeOrderId: orderId });
    // Verify with Cashfree and unlock immediately if paid (webhook may lag).
    try {
      await reconcilePendingPayment(payment);
    } catch (_) {}
  }

  const deepLink = `buildify://payment-success?order_id=${encodeURIComponent(orderId || "")}`;

  res.set("Content-Type", "text/html");
  res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <title>Buildify</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>
    // Try to open the app immediately, then again shortly after in case the
    // first attempt is blocked before the page finishes loading.
    var target = ${JSON.stringify(deepLink)};
    function openApp() { window.location.replace(target); }
    openApp();
    setTimeout(openApp, 1200);
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background:#FFFFFF; color:#0F0F0F; display:flex; min-height:100vh; align-items:center;
      justify-content:center; margin:0; text-align:center; }
    .card { padding:32px; }
    .brand { color:#19A463; font-weight:800; font-size:22px; }
    .msg { color:#6B7280; margin-top:8px; font-size:14px; }
    .btn { display:inline-block; margin-top:20px; padding:14px 22px; background:#1DBF73;
      color:#fff; font-weight:700; text-decoration:none; border-radius:14px; font-size:15px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Payment successful</div>
    <p class="msg">Returning you to Buildify&hellip;</p>
    <a class="btn" href="${deepLink}">Open Buildify</a>
  </div>
</body>
</html>`);

});

exports.getMyUnlockedProjects = asyncHandler(async (req, res) => {

  const projects = await Project.find({ unlockedBy: req.user.id })
    .select("-customerContact -unlockedBy -images")
    .sort({ createdAt: -1 })
    .lean();

  // Plain array (not paginated) to match ProjectService.getUnlockedProjects().
  res.status(200).json(projects);

});
