const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createOrder,
} = require("../controllers/cashfreeController");

const {
  cashfreeWebhook,
  getMyUnlockedProjects,
} = require("../controllers/paymentController");

// Engineer creates payment order (only for a project where their bid was accepted)
router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("engineer"),
  createOrder
);

// Engineer's own unlocked (paid-for) projects
router.get(
  "/my-unlocked-projects",
  authMiddleware,
  roleMiddleware("engineer"),
  getMyUnlockedProjects
);

// Cashfree webhook (no user JWT — verified via HMAC signature instead)
router.post(
  "/webhook",
  cashfreeWebhook
);

module.exports = router;
