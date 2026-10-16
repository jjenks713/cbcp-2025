const express = require('express');

const Inventory = require('../models/Inventory');
const { toDto } = require('./shop');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

const ITEM_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

router.get('/:itemId', async (req, res) => {
  const rows = await Inventory.find({ itemId: req.params.itemId }).sort({ createdAt: 1 }).lean();
  res.json({ inventory: rows.map(toDto) });
});

/**
 * Replaces an item's stock rows: body { rows: [{ size, stock, price }] },
 * one per size (size null for an item without sizes). Rows for sizes not
 * listed are removed, so this always matches the item's current sizes.
 */
router.put('/:itemId', async (req, res) => {
  const { itemId } = req.params;
  if (!ITEM_ID.test(itemId)) return res.status(400).json({ error: 'Invalid item ID' });

  const input = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!input) return res.status(400).json({ error: 'rows must be a list' });

  const rows = [];
  const seen = new Set();
  for (const row of input) {
    const size = typeof row?.size === 'string' && row.size.trim() ? row.size.trim() : null;
    const label = size ?? 'this item';
    if (seen.has(size)) return res.status(400).json({ error: `${label} is listed twice` });
    seen.add(size);
    if (!Number.isInteger(row?.stock) || row.stock < 0) {
      return res.status(400).json({ error: `Stock for ${label} must be a whole number, 0 or more` });
    }
    const price = row?.price === null || row?.price === undefined || row?.price === '' ? null : row.price;
    if (price !== null && (typeof price !== 'number' || !Number.isFinite(price) || price < 0)) {
      return res.status(400).json({ error: `Price for ${label} must be 0 or more (or blank)` });
    }
    rows.push({ size, stock: row.stock, price });
  }
  if (rows.some((r) => r.size === null) && rows.length > 1) {
    return res.status(400).json({ error: 'An item either has sizes or it doesn’t - not both' });
  }

  await Promise.all(
    rows.map((row) =>
      Inventory.updateOne(
        { itemId, size: row.size },
        { $set: { stock: row.stock, price: row.price } },
        { upsert: true, runValidators: true }
      )
    )
  );
  await Inventory.deleteMany({ itemId, size: { $nin: rows.map((r) => r.size) } });

  const saved = await Inventory.find({ itemId }).sort({ createdAt: 1 }).lean();
  res.json({ inventory: saved.map(toDto) });
});

module.exports = router;
