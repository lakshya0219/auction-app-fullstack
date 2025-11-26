const express = require("express");
const router = express.Router();
const db = require("../database");

router.get("/", (req, res) => {
  const query = `
    SELECT i.*, u.username as seller_name, 
           MAX(b.amount) as highest_bid,
           (SELECT COUNT(*) FROM bids WHERE item_id = i.id) as bid_count
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    LEFT JOIN bids b ON i.id = b.item_id
    WHERE i.status = 'active'
    GROUP BY i.id
    ORDER BY i.end_time ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

router.get("/:id", (req, res) => {
  const itemId = req.params.id;

  const itemQuery = `
    SELECT i.*, u.username as seller_name
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    WHERE i.id = ?
  `;

  const bidsQuery = `
    SELECT b.*, u.username
    FROM bids b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.item_id = ?
    ORDER BY b.amount DESC
  `;

  db.get(itemQuery, [itemId], (err, item) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    db.all(bidsQuery, [itemId], (err, bids) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...item, bids });
    });
  });
});

router.post("/", (req, res) => {
  const { title, description, starting_price, image_url, seller_id, end_time } =
    req.body;

  const query = `
    INSERT INTO items (title, description, starting_price, current_price, image_url, seller_id, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      title,
      description,
      starting_price,
      starting_price,
      image_url,
      seller_id,
      end_time,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: "Item created successfully" });
    }
  );
});

module.exports = router;
