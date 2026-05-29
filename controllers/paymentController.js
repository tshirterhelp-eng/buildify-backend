const razorpay = require("../config/razorpay");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
exports.createOrder = async (req, res) => {

  try {

   const paymentLink =
  await razorpay.paymentLink.create({

    amount: 2500 * 100,

    currency: "INR",

    description:
      "Buildify Contact Unlock",

    callback_method: "get",

    notify: {
      sms: true,
      email: true,
    }

  });

res.status(200).json({
  paymentUrl: paymentLink.short_url,
});

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
