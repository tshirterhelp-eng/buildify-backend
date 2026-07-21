// Price (in rupees) an engineer pays to unlock a project's contact details.
// Override via the UNLOCK_AMOUNT environment variable (whole rupees, e.g. 1999).
//
// NOTE: the amount shown in the mobile app UI is currently hardcoded to
// ₹2,500 on the frontend. Changing this env var changes what is actually
// charged, but the app's displayed price will not update until the frontend
// is changed too.
const UNLOCK_AMOUNT_RUPEES = parseInt(process.env.UNLOCK_AMOUNT, 10) || 2500;

module.exports = { UNLOCK_AMOUNT_RUPEES };
