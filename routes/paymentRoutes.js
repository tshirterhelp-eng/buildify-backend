const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createOrder,
} = require("../controllers/cashfreeController");

const {
  cashfreeWebhook,
  paymentReturn,
  getMyUnlockedProjects,
} = require("../controllers/paymentController");

// Engineer creates a Cashfree order (only for a project where their bid was accepted)
router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("engineer"),
  createOrder
);

// Cashfree server-to-server webhook (verified by HMAC signature)
router.post("/webhook", cashfreeWebhook);

// Post-payment browser redirect target — confirms payment and bounces to the app
router.get("/return", paymentReturn);

// Engineer's own unlocked (paid-for) projects
router.get(
  "/my-unlocked-projects",
  authMiddleware,
  roleMiddleware("engineer"),
  getMyUnlockedProjects
);

module.exports = router;
