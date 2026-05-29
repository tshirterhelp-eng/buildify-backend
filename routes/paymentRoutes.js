const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createOrder,
} = require("../controllers/cashfreeController");

const {
  cashfreeWebhook,
} = require("../controllers/paymentController");

// Engineer creates payment order
router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("engineer"),
  createOrder
);

// Cashfree webhook
router.post(
  "/webhook",
  cashfreeWebhook
);

module.exports = router;
