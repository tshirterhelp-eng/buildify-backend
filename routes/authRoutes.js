const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  register,
  login
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authMiddleware, (req, res) => {

  res.json({
    message: "Protected profile route",
    user: req.user
  });

});
router.get(
  "/engineer-dashboard",
  authMiddleware,
  roleMiddleware("engineer"),
  (req, res) => {

    res.json({
      message: "Welcome Engineer Dashboard"
    });

  }
);
module.exports = router;