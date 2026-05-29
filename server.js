require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const webhookRoutes =
require("./routes/webhookRoutes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Buildify Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.post("/api/payments/webhook", async (req, res) => {
  console.log(req.body);

  res.status(200).send("OK");
});
