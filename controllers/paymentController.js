const Payment = require("../models/Payment");
const Project = require("../models/Project");

exports.cashfreeWebhook = async (req, res) => {
  try {

    console.log("WEBHOOK:", req.body);

    const data = req.body.data;

    if (
      data &&
      data.payment &&
      data.payment.payment_status === "SUCCESS"
    ) {

      const orderId =
        data.order.order_id;

      const paymentId =
        data.payment.cf_payment_id;

      // Find pending payment
      const payment =
        await Payment.findOne({
          cashfreeOrderId: orderId,
        });

      if (payment) {

        payment.status = "completed";

        payment.cashfreePaymentId =
          paymentId;

        await payment.save();

        await Project.findByIdAndUpdate(
          payment.projectId,
          {
            $addToSet: {
              unlockedBy:
                payment.engineerId,
            },
          }
        );
      }
    }

    res.status(200).send("OK");

  } catch (err) {

    console.log(err);

    res.status(500).send("Error");
  }
};
