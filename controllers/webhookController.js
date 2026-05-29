const crypto = require("crypto");
const Project = require("../models/Project");

exports.handleWebhook = async (req, res) => {
  try {

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature =
      req.headers["x-razorpay-signature"];

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (signature !== expectedSignature) {
      return res
        .status(400)
        .json({
          message:
            "Invalid webhook signature",
        });
    }

    console.log(
      "Webhook Received:",
      req.body
    );

    res.status(200).json({
      success: true,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message,
    });

  }
};
