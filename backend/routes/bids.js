const express = require("express");
const router = express.Router();
const db = require("../database");
const { authenticateToken } = require("./auth");

// Place a bid with concurrency control
router.post("/", authenticateToken, (req, res) => {
  const { item_id, amount } = req.body;
  const user_id = req.user.userId;

  db.serialize(() => {
    // Start transaction
    db.run("BEGIN TRANSACTION");

    // Check if item exists and is active
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

        // Check if bid is higher than current price
        if (amount <= item.current_price) {
          db.run("ROLLBACK");
          return res
            .status(400)
            .json({ error: "Bid must be higher than current price" });
        }

        // Check if auction has ended
        const now = new Date();
        const endTime = new Date(item.end_time);
        if (now > endTime) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Auction has ended" });
        }

        // Check if user is the seller
        if (item.seller_id === user_id) {
          db.run("ROLLBACK");
          return res
            .status(400)
            .json({ error: "You cannot bid on your own item" });
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

          // Update item current price
          db.run(
            "UPDATE items SET current_price = ? WHERE id = ?",
            [amount, item_id],
            function (err) {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
              }

              const bidId = this.lastID;

              // Get username for socket emission
              db.get(
                "SELECT username FROM users WHERE id = ?",
                [user_id],
                (err, user) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                  }

                  // Check for auto-snipe prevention (last 10 seconds)
                  const timeLeft = endTime - now;
                  let extended = false;
                  let newEndTime = null;

                  if (timeLeft <= 10000) {
                    // 10 seconds in milliseconds
                    newEndTime = new Date(endTime.getTime() + 30000); // Add 30 seconds
                    extended = true;

                    db.run(
                      "UPDATE items SET end_time = ? WHERE id = ?",
                      [newEndTime.toISOString(), item_id],
                      function (err) {
                        if (err) {
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: err.message });
                        }

                        db.run("COMMIT");

                        // Emit socket events
                        const io = req.app.get("io");
                        const bidData = {
                          item_id: parseInt(item_id),
                          user_id: user_id,
                          amount: amount,
                          username: user.username,
                          created_at: new Date().toISOString(),
                        };

                        io.to(`item_${item_id}`).emit("bidUpdate", bidData);

                        if (extended) {
                          io.to(`item_${item_id}`).emit("timerExtended", {
                            item_id: parseInt(item_id),
                            new_end_time: newEndTime.toISOString(),
                          });
                        }

                        res.json({
                          success: true,
                          bid_id: bidId,
                          extended: extended,
                          new_end_time: newEndTime
                            ? newEndTime.toISOString()
                            : null,
                        });
                      }
                    );
                  } else {
                    db.run("COMMIT");

                    // Emit socket event
                    const io = req.app.get("io");
                    const bidData = {
                      item_id: parseInt(item_id),
                      user_id: user_id,
                      amount: amount,
                      username: user.username,
                      created_at: new Date().toISOString(),
                    };

                    io.to(`item_${item_id}`).emit("bidUpdate", bidData);

                    res.json({
                      success: true,
                      bid_id: bidId,
                      extended: false,
                    });
                  }
                }
              );
            }
          );
        });
      }
    );
  });
});

// Get bids for an item
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

// Get bids by user
router.get("/user/:userId", (req, res) => {
  const query = `
    SELECT b.*, i.title as item_title, i.image_url
    FROM bids b
    LEFT JOIN items i ON b.item_id = i.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;

  db.all(query, [req.params.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
