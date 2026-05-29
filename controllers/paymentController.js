const razorpay = require("../config/razorpay");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
exports.createOrder = async (req, res) => {

  try {

    const options = {

      amount: 2500 * 100,

      currency: "INR",

      receipt: `receipt_${Date.now()}`

    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(order);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};

exports.verifyPayment = async (req, res) => {

  try {

    const {
      razorpayOrderId,
      razorpayPaymentId,
      projectId
    } = req.body;

    const payment = await Payment.create({

      engineerId: req.user.id,

      projectId,

      razorpayOrderId,

      razorpayPaymentId,

      status: "completed"

    });

    await Project.findByIdAndUpdate(

      projectId,

      {
        $push: {
          unlockedBy: req.user.id
        }
      }

    );

    res.status(200).json({

      message: "Payment verified and contact unlocked",

      payment

    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};