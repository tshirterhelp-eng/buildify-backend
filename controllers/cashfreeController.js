const cashfree = require("../config/cashfree");

exports.createOrder = async (req, res) => {
  try {

    const orderId =
      "BUILDIFY_" + Date.now();

    const request = {
      order_amount: 2500,
      order_currency: "INR",
      order_id: orderId,

      customer_details: {
        customer_id: req.user.id,
        customer_phone: "9999999999"
      },

      order_meta: {
        return_url:
          "https://buildify-backend-60bl.onrender.com/payment-success?order_id={order_id}"
      }
    };

    const response =
      await cashfree.PGCreateOrder(
        request
      );

    console.log(response.data);

    res.status(200).json({
      success: true,
      paymentSessionId:
        response.data.payment_session_id,
      orderId
    });

  } catch (error) {

    console.log(
      error.response?.data || error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
};
