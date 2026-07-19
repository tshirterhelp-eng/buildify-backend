const Razorpay = require("razorpay");

// Production vs test is determined purely by which keys you supply:
// rzp_live_* keys = production, rzp_test_* keys = test mode.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
