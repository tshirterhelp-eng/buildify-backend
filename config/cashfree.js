const { Cashfree } = require("cashfree-pg");

// Defaults to PRODUCTION. Set CASHFREE_ENV=sandbox in .env to use the
// Cashfree sandbox while testing.
const isSandbox = (process.env.CASHFREE_ENV || "production").toLowerCase() === "sandbox";

const cashfree = new Cashfree(
  isSandbox ? Cashfree.SANDBOX : Cashfree.PRODUCTION,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

module.exports = cashfree;
module.exports.isSandbox = isSandbox;
