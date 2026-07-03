const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  submitBid,
  updateMyBid,
  withdrawBid,
  getMyBids,
  getMyBidOnProject,
  getProjectBids,
  acceptBid,
  rejectBid,
} = require("../controllers/bidController");

// Engineer actions
router.post("/", authMiddleware, roleMiddleware("engineer"), submitBid);
router.patch("/:bidId", authMiddleware, roleMiddleware("engineer"), updateMyBid);
router.patch("/:bidId/withdraw", authMiddleware, roleMiddleware("engineer"), withdrawBid);
router.get("/my-bids", authMiddleware, roleMiddleware("engineer"), getMyBids);
router.get("/my-bid/:projectId", authMiddleware, roleMiddleware("engineer"), getMyBidOnProject);

// Customer actions
router.get("/project/:projectId", authMiddleware, roleMiddleware("customer"), getProjectBids);
router.patch("/:bidId/accept", authMiddleware, roleMiddleware("customer"), acceptBid);
router.patch("/:bidId/reject", authMiddleware, roleMiddleware("customer"), rejectBid);

module.exports = router;
