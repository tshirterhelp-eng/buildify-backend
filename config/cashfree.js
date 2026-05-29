const { Cashfree, CFEnvironment } =
  require("cashfree-pg");

Cashfree.XClientId =
  process.env.CASHFREE_CLIENT_ID;

Cashfree.XClientSecret =
  process.env.CASHFREE_CLIENT_SECRET;

Cashfree.XEnvironment =
  CFEnvironment.SANDBOX;

module.exports = Cashfree;