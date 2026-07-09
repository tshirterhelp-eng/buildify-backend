const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createOrder,
} = require("../controllers/razorpayController");

const {
  verifyPayment,
  razorpayWebhook,
  getMyUnlockedProjects,
} = require("../controllers/paymentController");

// Engineer creates a Razorpay order (only for a project where their bid was accepted)
router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("engineer"),
  createOrder
);

// Hosted checkout success callback (verified by Razorpay signature, no JWT needed)
router.post("/verify", verifyPayment);

// Razorpay server-to-server webhook (verified by HMAC signature)
router.post("/webhook", razorpayWebhook);

// Engineer's own unlocked (paid-for) projects
router.get(
  "/my-unlocked-projects",
  authMiddleware,
  roleMiddleware("engineer"),
  getMyUnlockedProjects
);

module.exports = router;
