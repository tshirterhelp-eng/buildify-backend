const cashfree = require("../config/cashfree");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const Bid = require("../models/Bid");
const asyncHandler = require("../middleware/asyncHandler");

const UNLOCK_AMOUNT_RUPEES = 2500;

// Engineer creates a Cashfree order to unlock contact details.
// Only allowed for the engineer whose bid was accepted on this project.
exports.createOrder = asyncHandler(async (req, res) => {

  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  if (
    !project.assignedEngineerId ||
    String(project.assignedEngineerId) !== String(req.user.id)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not the accepted engineer for this project",
    });
  }

  const acceptedBid = await Bid.findOne({
    projectId,
    engineerId: req.user.id,
    status: "accepted",
  });

  if (!acceptedBid) {
    return res.status(403).json({
      success: false,
      message: "No accepted bid found for this project",
    });
  }

  const existingPending = await Payment.findOne({
    projectId,
    engineerId: req.user.id,
    status: "pending",
  });

  if (existingPending) {
    return res.status(409).json({
      success: false,
      message: "A payment is already pending for this project",
      orderId: existingPending.cashfreeOrderId,
    });
  }

  const orderId = "BUILDIFY_" + Date.now();

  const request = {
    order_amount: UNLOCK_AMOUNT_RUPEES,
    order_currency: "INR",
    order_id: orderId,

    customer_details: {
      customer_id: req.user.id,
      customer_phone: "9999999999",
    },

    order_meta: {
      // Custom app URL scheme (registered in AndroidManifest.xml / iOS
      // Info.plist) so Cashfree's hosted checkout returns straight into the app.
      return_url: "buildify://payment-success?order_id={order_id}",
    },
  };

  let response;
  try {
    response = await cashfree.PGCreateOrder(request);
  } catch (err) {
    // The raw Cashfree/axios error includes the request headers (with the
    // secret key) and a huge socket object — never log that. Log only the
    // status + Cashfree's own message.
    const status = err.response && err.response.status;
    const cfMessage =
      (err.response && err.response.data && err.response.data.message) ||
      err.message;
    console.error(
      `Cashfree order failed (${cashfree.isSandbox ? "sandbox" : "production"} mode): ` +
      `${status || ""} ${cfMessage}`
    );

    const hint =
      status === 401
        ? "Payment gateway rejected the credentials. Check that CASHFREE_ENV matches your key type (test vs production) and that the keys are correct."
        : "Could not start the payment. Please try again.";

    return res.status(502).json({ success: false, message: hint });
  }

  await Payment.create({
    engineerId: req.user.id,
    projectId,
    bidId: acceptedBid._id,
    cashfreeOrderId: orderId,
    amount: UNLOCK_AMOUNT_RUPEES,
    status: "pending",
  });

  const mode = cashfree.isSandbox ? "sandbox" : "production";

  res.status(200).json({
    success: true,
    paymentSessionId: response.data.payment_session_id,
    orderId,
    checkoutUrl:
      `${req.protocol}://${req.get("host")}/checkout.html` +
      `?session_id=${response.data.payment_session_id}&mode=${mode}`,
  });

});
