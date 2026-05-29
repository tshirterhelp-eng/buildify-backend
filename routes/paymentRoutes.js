const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createOrder,
} = require("../controllers/cashfreeController");

router.post(
  "/create-order",
  authMiddleware,
  roleMiddleware("engineer"),
  createOrder
);

module.exports = router;
