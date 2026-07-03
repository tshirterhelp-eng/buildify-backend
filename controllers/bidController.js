const Bid = require("../models/Bid");
const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");

exports.submitBid = asyncHandler(async (req, res) => {
  const { projectId, amount, message, estimatedTimeline } = req.body;

  if (!projectId || !amount || !message || !estimatedTimeline) {
    return res.status(400).json({
      message: "projectId, amount, message and estimatedTimeline are required",
    });
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (project.status !== "open") {
    return res.status(400).json({
      message: "This project is no longer accepting bids",
    });
  }

  const existingBid = await Bid.findOne({
    projectId,
    engineerId: req.user.id,
  });

  if (existingBid) {
    if (existingBid.status === "pending") {
      return res.status(409).json({
        message: "You already have a pending bid on this project — update it instead",
      });
    }

    // Bid was previously withdrawn/rejected — allow re-bidding by reviving
    // the same document instead of violating the unique (projectId, engineerId) index.
    existingBid.amount = amount;
    existingBid.message = message;
    existingBid.estimatedTimeline = estimatedTimeline;
    existingBid.status = "pending";
    existingBid.updatedAt = Date.now();
    await existingBid.save();

    return res.status(201).json(existingBid);
  }

  const bid = await Bid.create({
    projectId,
    engineerId: req.user.id,
    amount,
    message,
    estimatedTimeline,
  });

  res.status(201).json(bid);
});

exports.updateMyBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const { amount, message, estimatedTimeline } = req.body;

  const bid = await Bid.findById(bidId);

  if (!bid) {
    return res.status(404).json({ message: "Bid not found" });
  }

  if (String(bid.engineerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "This is not your bid" });
  }

  if (bid.status !== "pending") {
    return res.status(400).json({ message: "Only pending bids can be edited" });
  }

  if (amount !== undefined) bid.amount = amount;
  if (message !== undefined) bid.message = message;
  if (estimatedTimeline !== undefined) bid.estimatedTimeline = estimatedTimeline;
  bid.updatedAt = Date.now();

  await bid.save();

  res.status(200).json(bid);
});

exports.withdrawBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;

  const bid = await Bid.findById(bidId);

  if (!bid) {
    return res.status(404).json({ message: "Bid not found" });
  }

  if (String(bid.engineerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "This is not your bid" });
  }

  if (bid.status !== "pending") {
    return res.status(400).json({ message: "Only pending bids can be withdrawn" });
  }

  bid.status = "withdrawn";
  bid.updatedAt = Date.now();
  await bid.save();

  res.status(200).json(bid);
});

exports.getMyBids = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const filter = { engineerId: req.user.id };

  const [bids, totalCount] = await Promise.all([
    Bid.find(filter)
      .populate("projectId", "title location budget projectType status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bid.countDocuments(filter),
  ]);

  res.status(200).json({
    bids,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });
});

exports.getMyBidOnProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const bid = await Bid.findOne({
    projectId,
    engineerId: req.user.id,
  }).lean();

  res.status(200).json({ bid: bid || null });
});

exports.getProjectBids = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (String(project.customerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "This is not your project" });
  }

  const filter = { projectId };

  const [bids, totalCount] = await Promise.all([
    Bid.find(filter)
      .populate("engineerId", "name email phone engineerType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bid.countDocuments(filter),
  ]);

  res.status(200).json({
    bids,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });
});

exports.acceptBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;

  const bid = await Bid.findById(bidId).populate("projectId");

  if (!bid || !bid.projectId) {
    return res.status(404).json({ message: "Bid not found" });
  }

  const project = bid.projectId;

  if (String(project.customerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "This is not your project" });
  }

  if (bid.status !== "pending") {
    return res.status(400).json({ message: "This bid is no longer pending" });
  }

  if (project.status !== "open") {
    return res.status(400).json({ message: "This project already has an accepted bid" });
  }

  bid.status = "accepted";
  bid.updatedAt = Date.now();
  await bid.save();

  await Bid.updateMany(
    { projectId: project._id, _id: { $ne: bid._id }, status: "pending" },
    { $set: { status: "rejected", updatedAt: Date.now() } }
  );

  await Project.findByIdAndUpdate(project._id, {
    status: "in-progress",
    assignedEngineerId: bid.engineerId,
  });

  res.status(200).json(bid);
});

exports.rejectBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;

  const bid = await Bid.findById(bidId).populate("projectId");

  if (!bid || !bid.projectId) {
    return res.status(404).json({ message: "Bid not found" });
  }

  if (String(bid.projectId.customerId) !== String(req.user.id)) {
    return res.status(403).json({ message: "This is not your project" });
  }

  if (bid.status !== "pending") {
    return res.status(400).json({ message: "This bid is no longer pending" });
  }

  bid.status = "rejected";
  bid.updatedAt = Date.now();
  await bid.save();

  res.status(200).json(bid);
});
