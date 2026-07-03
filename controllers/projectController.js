const Project = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");

exports.createProject = asyncHandler(async (req, res) => {

  const {
    title,
    description,
    budget,
    location,
    projectType,
    phone,
    email
  } = req.body;

  const project = await Project.create({

    title,
    description,
    budget,
    location,
    projectType,

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
      .select("-customerContact -unlockedBy")
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

exports.getProjectContact = asyncHandler(async (req, res) => {

  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {

    return res.status(404).json({
      message: "Project not found"
    });

  }

  const isUnlocked = project.unlockedBy.includes(req.user.id);

  if (!isUnlocked) {

    return res.status(403).json({
      message: "You must pay ₹2500 to access contact details"
    });

  }

  res.status(200).json({

    customerContact: project.customerContact

  });

});
