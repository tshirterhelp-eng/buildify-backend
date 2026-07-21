const cashfree = require("../config/cashfree");
const Payment = require("../models/Payment");
const Project = require("../models/Project");

// Idempotently mark a payment completed and unlock the project for the engineer.
async function markPaid(payment, cashfreePaymentId) {
  if (!payment || payment.status === "completed") return;

  payment.status = "completed";
  if (cashfreePaymentId) payment.cashfreePaymentId = cashfreePaymentId;
  await payment.save();

  await Project.findByIdAndUpdate(payment.projectId, {
    $addToSet: { unlockedBy: payment.engineerId },
  });
}

// Fallback for missed/failed webhooks: ask Cashfree directly whether this
// pending order was actually paid, and unlock if so. Returns true if the
// order is (now) paid. Safe to call often — it no-ops once completed.
async function reconcilePendingPayment(payment) {
  if (!payment) return false;
  if (payment.status === "completed") return true;
  if (!payment.cashfreeOrderId) return false;

  try {
    const resp = await cashfree.PGFetchOrder(payment.cashfreeOrderId);
    const status = resp && resp.data && resp.data.order_status;

    if (status === "PAID") {
      await markPaid(payment);
      return true;
    }
  } catch (err) {
    // Never log the raw error (it carries the secret key). Status + message only.
    console.error(
      "Cashfree order reconcile failed:",
      (err.response && err.response.status) || "",
      (err.response && err.response.data && err.response.data.message) || err.message
    );
  }

  return false;
}

module.exports = { markPaid, reconcilePendingPayment };
