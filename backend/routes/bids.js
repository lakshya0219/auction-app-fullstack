const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", (req, res) => {
  const { item_id, user_id, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.get(
      'SELECT * FROM items WHERE id = ? AND status = "active"',
      [item_id],
      (err, item) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        if (!item) {
          db.run("ROLLBACK");
          return res
            .status(404)
            .json({ error: "Item not found or auction ended" });
        }

        if (amount <= item.current_price) {
          db.run("ROLLBACK");
          return res
            .status(400)
            .json({ error: "Bid must be higher than current price" });
        }

        const now = new Date();
        const endTime = new Date(item.end_time);
        if (now > endTime) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Auction has ended" });
        }

        // Insert bid with unique constraint to prevent race conditions
        const insertBid = `INSERT INTO bids (item_id, user_id, amount) VALUES (?, ?, ?)`;
        db.run(insertBid, [item_id, user_id, amount], function (err) {
          if (err) {
            db.run("ROLLBACK");
            if (err.code === "SQLITE_CONSTRAINT") {
              return res
                .status(409)
                .json({
                  error: "Bid conflict - someone else bid the same amount",
                });
            }
            return res.status(500).json({ error: err.message });
          }

          db.run(
            "UPDATE items SET current_price = ? WHERE id = ?",
            [amount, item_id],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
              }

              const timeLeft = endTime - now;
              if (timeLeft <= 10000) {
                const newEndTime = new Date(endTime.getTime() + 30000);
                db.run(
                  "UPDATE items SET end_time = ? WHERE id = ?",
                  [newEndTime.toISOString(), item_id],
                  function (err) {
                    if (err) {
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: err.message });
                    }

                    db.run("COMMIT");
                    res.json({
                      success: true,
                      bid_id: this.lastID,
                      extended: true,
                      new_end_time: newEndTime.toISOString(),
                    });
                  }
                );
              } else {
                db.run("COMMIT");
                res.json({
                  success: true,
                  bid_id: this.lastID,
                  extended: false,
                });
              }
            }
          );
        });
      }
    );
  });
});

router.get("/item/:itemId", (req, res) => {
  const query = `
    SELECT b.*, u.username
    FROM bids b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.item_id = ?
    ORDER BY b.amount DESC
  `;

  db.all(query, [req.params.itemId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
