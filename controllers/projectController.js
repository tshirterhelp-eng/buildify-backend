const Project = require("../models/Project");

exports.createProject = async (req, res) => {

  try {

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

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

exports.getProjects = async (req, res) => {

  try {

    const projects = await Project.find()
      .sort({ createdAt: -1 });

    res.status(200).json(projects);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};
exports.getMyProjects = async (
  req,
  res
) => {

  try {

    console.log("REQ USER:");
    console.log(req.user);

    const projects =
      await Project.find({

        customerId: req.user.id.toString()

      }).sort({
        createdAt: -1
      });

    console.log("PROJECTS:");
    console.log(projects);

    res.status(200).json(projects);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message,
    });

  }

};

exports.getProjectContact = async (req, res) => {

  try {

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

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};