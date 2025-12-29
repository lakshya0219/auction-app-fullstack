const express = require("express");
const router = express.Router();
const db = require("../database");
const { authenticateToken } = require("./auth");

// Get all active items with filtering and pagination
router.get("/", (req, res) => {
  const { category, search, page = 1, limit = 12 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT i.*, u.username as seller_name, 
           MAX(b.amount) as highest_bid,
           (SELECT COUNT(*) FROM bids WHERE item_id = i.id) as bid_count
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    LEFT JOIN bids b ON i.id = b.item_id
    WHERE i.status = 'active' AND i.end_time > datetime('now')
  `;

  let countQuery = `SELECT COUNT(*) as total FROM items i WHERE i.status = 'active' AND i.end_time > datetime('now')`;
  const params = [];

  if (category && category !== "all") {
    query += " AND i.category = ?";
    countQuery += " AND i.category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (i.title LIKE ? OR i.description LIKE ?)";
    countQuery += " AND (i.title LIKE ? OR i.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " GROUP BY i.id ORDER BY i.end_time ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  // Get total count
  db.get(countQuery, params.slice(0, -2), (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get items
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        items: rows,
        total: countResult.total,
        page: parseInt(page),
        totalPages: Math.ceil(countResult.total / limit),
      });
    });
  });
});

// Get categories
router.get("/categories", (req, res) => {
  const query = `SELECT DISTINCT category FROM items WHERE status = 'active'`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map((row) => row.category));
  });
});

// Get single item with bids
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

// Create new item (protected route)
router.post("/", authenticateToken, (req, res) => {
  const {
    title,
    description,
    category,
    starting_price,
    image_url,
    end_time,
    bid_increment,
  } = req.body;
  const seller_id = req.user.userId;

  const query = `
    INSERT INTO items (title, description, category, starting_price, current_price, image_url, seller_id, end_time, bid_increment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      title,
      description,
      category,
      starting_price,
      starting_price,
      image_url,
      seller_id,
      end_time,
      bid_increment || 1.0,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Emit new item event
      const io = req.app.get("io");
      io.emit("newItem", {
        id: this.lastID,
        title,
        description,
        category,
        starting_price,
        current_price: starting_price,
        image_url,
        seller_id,
        seller_name: req.user.username,
        end_time,
        bid_increment: bid_increment || 1.0,
        bid_count: 0,
      });

      res.json({ id: this.lastID, message: "Item created successfully" });
    }
  );
});

// Get user's items
router.get("/user/my-items", authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT i.*, 
           (SELECT COUNT(*) FROM bids WHERE item_id = i.id) as bid_count,
           (SELECT MAX(amount) FROM bids WHERE item_id = i.id) as highest_bid
    FROM items i
    WHERE i.seller_id = ?
    ORDER BY i.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
