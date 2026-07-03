const cashfree = require("../config/cashfree");
const Payment = require("../models/Payment");
const Project = require("../models/Project");
const Bid = require("../models/Bid");
const asyncHandler = require("../middleware/asyncHandler");

exports.createOrder = asyncHandler(async (req, res) => {

  if (!req.body.projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required"
    });
  }

  const { projectId } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found"
    });
  }

  if (
    !project.assignedEngineerId ||
    String(project.assignedEngineerId) !== String(req.user.id)
  ) {
    return res.status(403).json({
      success: false,
      message: "You are not the accepted engineer for this project"
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
      message: "No accepted bid found for this project"
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
      // Custom app URL scheme, registered in AndroidManifest.xml /
      // iOS Info.plist, so Cashfree's hosted checkout redirects straight
      // back into the app rather than a dead backend HTTPS route.
      return_url:
        "buildify://payment-success?order_id={order_id}"
    }
  };

  const response =
    await cashfree.PGCreateOrder(request);
    console.log(
"CASHFREE RESPONSE:",
JSON.stringify(response.data, null, 2)
);

  await Payment.create({
    engineerId: req.user.id,
    projectId,
    bidId: acceptedBid._id,
    cashfreeOrderId: orderId,
    amount: 2500,
    status: "pending"
  });

  res.status(200).json({
success: true,
paymentSessionId:
  response.data.payment_session_id,
orderId,
checkoutUrl:
  `${req.protocol}://${req.get("host")}/checkout.html?session_id=${response.data.payment_session_id}`
});

});
