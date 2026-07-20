const { Cashfree, CFEnvironment } = require("cashfree-pg");

// Defaults to PRODUCTION. Set CASHFREE_ENV=sandbox in .env to use the
// Cashfree sandbox while testing.
//
// NOTE: in cashfree-pg v6 the environment enum is `CFEnvironment`
// (SANDBOX / PRODUCTION). The older `Cashfree.SANDBOX` / `Cashfree.PRODUCTION`
// constants are `undefined` in this version, and passing undefined makes the
// SDK silently fall back to SANDBOX — which is the bug this fixes.
const isSandbox = (process.env.CASHFREE_ENV || "production").toLowerCase() === "sandbox";

const cashfree = new Cashfree(
  isSandbox ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

console.log(`Cashfree mode: ${isSandbox ? "SANDBOX" : "PRODUCTION"}`);

module.exports = cashfree;
module.exports.isSandbox = isSandbox;
