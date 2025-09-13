const express = require("express");
const crypto = require("crypto");
const { Customer, Order, Product } = require("../models");

const router = express.Router();

// Middleware to capture raw body for HMAC
router.use((req, res, next) => {
  let data = [];
  req.on("data", chunk => data.push(chunk));
  req.on("end", () => {
    req.rawBody = Buffer.concat(data).toString();
    next();
  });
});

// Verify Shopify HMAC
function verifyShopify(req, res, next) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const secret = process.env.SHOPIFY_API_SECRET;

  const hash = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody, "utf8")
    .digest("base64");

  if (hash !== hmacHeader) {
    return res.status(401).send("Invalid HMAC");
  }
  next();
}

// === Order webhook ===
router.post("/orders", verifyShopify, express.json(), async (req, res) => {
  try {
    const order = req.body;
    await Order.create({
      customer_id: null, 
      product_id: null,
      total: order.total_price || 0,
      tenant_id: 1, 
      createdAt: new Date(order.created_at),
    });

    console.log("✅ Order ingested:", order.id);
    res.status(200).send("ok");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("error");
  }
});

module.exports = router;
