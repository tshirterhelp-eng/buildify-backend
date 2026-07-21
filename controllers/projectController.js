const Project = require("../models/Project");
const Payment = require("../models/Payment");
const asyncHandler = require("../middleware/asyncHandler");
const { reconcilePendingPayment } = require("../utils/paymentUnlock");
const { UNLOCK_AMOUNT_RUPEES } = require("../config/pricing");

exports.createProject = asyncHandler(async (req, res) => {

  const {
    title,
    description,
    budget,
    location,
    projectType,
    phone,
    email,
    images
  } = req.body;

  if (!Array.isArray(images) || images.length < 1) {
    return res.status(400).json({
      message: "At least one land image is required"
    });
  }

  if (images.length > 5) {
    return res.status(400).json({
      message: "You can upload at most 5 land images"
    });
  }

  const project = await Project.create({

    title,
    description,
    budget,
    location,
    projectType,
    images,

    customerContact: {
      phone,
      email
    },

    customerId: req.user.id.toString()

  });

  res.status(201).json({
    message: "Project created successfully",
    project
  });

});

exports.getProjects = asyncHandler(async (req, res) => {

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  // Engineers browse only open (biddable) projects; contact details and
  // the unlock list are never exposed here — only via the paid unlock route.
  const filter = { status: "open" };

  if (req.query.projectType) filter.projectType = req.query.projectType;
  if (req.query.location) filter.location = new RegExp(req.query.location, "i");
  if (req.query.q) filter.title = new RegExp(req.query.q, "i");

  const [projects, totalCount] = await Promise.all([
    Project.find(filter)
      // images are base64 blobs — excluded here so browse stays fast;
      // fetched per-project via GET /api/projects/:projectId/images
      .select("-customerContact -unlockedBy -images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({
    projects,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });

});

exports.getMyProjects = asyncHandler(async (
  req,
  res
) => {

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const filter = { customerId: req.user.id.toString() };

  const [projects, totalCount] = await Promise.all([
    Project.find(filter)
      .select("-images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.status(200).json({
    projects,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  });

});

// Land images for one project. Kept out of the list endpoints because the
// base64 payloads are large; any authenticated user may view them (they're
// not sensitive — unlike customerContact).
exports.getProjectImages = asyncHandler(async (req, res) => {

  const { projectId } = req.params;

  const project = await Project.findById(projectId).select("images").lean();

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  res.status(200).json({ images: project.images || [] });

});

exports.getProjectContact = asyncHandler(async (req, res) => {

  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {

    return res.status(404).json({
      message: "Project not found"
    });

  }

  // Contact is unlocked ONLY when a completed payment exists for this
  // engineer + project. We check the Payment record (the authoritative
  // source) rather than project.unlockedBy, and accepting a bid must NOT
  // unlock contact on its own.
  let paid = await Payment.exists({
    projectId,
    engineerId: req.user.id,
    status: "completed",
  });

  // Fallback for a missed/failed webhook: if there's still a pending payment,
  // ask Cashfree directly whether the order was actually paid, and unlock if
  // so. This means contact unlocks even when the webhook never arrives.
  if (!paid) {
    const pending = await Payment.findOne({
      projectId,
      engineerId: req.user.id,
      status: "pending",
    });

    if (pending) {
      paid = await reconcilePendingPayment(pending);
    }
  }

  if (!paid) {

    return res.status(403).json({
      message: `You must pay ₹${UNLOCK_AMOUNT_RUPEES} to access contact details`
    });

  }

  res.status(200).json({

    customerContact: project.customerContact

  });

});
