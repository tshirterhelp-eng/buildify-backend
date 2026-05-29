const Cashfree = require("../config/cashfree");

exports.createOrder = async (req, res) => {
  try {

    const { projectId } = req.body;

    const orderId =
      "BUILDIFY_" + Date.now();

    const request = {
      order_amount: 2500,
      order_currency: "INR",

      customer_details: {
        customer_id: req.user.id,
        customer_name: "Engineer",
        customer_email: "engineer@buildify.com",
        customer_phone: "9999999999",
      },

      order_meta: {
        return_url:
          "https://buildify-backend-60bl.onrender.com/payment-success?order_id={order_id}",
      },
    };

    const response =
      await Cashfree.PGCreateOrder(
        "2023-08-01",
        request
      );

    res.status(200).json({
      paymentSessionId:
        response.data.payment_session_id,
      orderId,
    });

  } catch (error) {

    console.log(
      error.response?.data || error
    );

    res.status(500).json({
      error: error.message,
    });

  }
};
