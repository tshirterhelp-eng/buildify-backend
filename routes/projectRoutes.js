const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createProject,
  getProjects,
   getMyProjects,
  getProjectContact
} = require("../controllers/projectController");

router.post(
  "/create",
  authMiddleware,
  roleMiddleware("customer"),
  createProject
);
router.get(
  "/all",
  authMiddleware,
  getProjects
);
router.get(

  "/my-projects",

  authMiddleware,

  roleMiddleware("customer"),

  getMyProjects

);
router.get(
  "/contact/:projectId",
  authMiddleware,
  roleMiddleware("engineer"),
  getProjectContact
);
module.exports = router;