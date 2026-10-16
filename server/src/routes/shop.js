const express = require('express');

const Inventory = require('../models/Inventory');

const router = express.Router();

const toDto = (row) => ({ itemId: row.itemId, size: row.size, stock: row.stock, price: row.price });

// Public: every item's stock and per-size prices, which the shop combines
// with the product details from Contentful. Small enough to send whole.
router.get('/inventory', async (req, res) => {
  const rows = await Inventory.find({}, { itemId: 1, size: 1, stock: 1, price: 1 }).lean();
  res.json({ inventory: rows.map(toDto) });
});

module.exports = router;
module.exports.toDto = toDto;
