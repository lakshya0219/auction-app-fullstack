const db = require("../database");

class Item {
  // Create new auction item
  static create(itemData, callback) {
    const {
      title,
      description,
      starting_price,
      image_url,
      seller_id,
      end_time,
    } = itemData;
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
          return callback(err);
        }
        callback(null, {
          id: this.lastID,
          title,
          description,
          starting_price,
          current_price: starting_price,
          image_url,
          seller_id,
          end_time,
        });
      }
    );
  }

  // Find item by ID
  static findById(id, callback) {
    const query = `
      SELECT i.*, u.username as seller_name
      FROM items i
      LEFT JOIN users u ON i.seller_id = u.id
      WHERE i.id = ?
    `;

    db.get(query, [id], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row);
    });
  }

  // Get all active items
  static findActive(callback) {
    const query = `
      SELECT i.*, u.username as seller_name,
             MAX(b.amount) as highest_bid,
             (SELECT COUNT(*) FROM bids WHERE item_id = i.id) as bid_count
      FROM items i
      LEFT JOIN users u ON i.seller_id = u.id
      LEFT JOIN bids b ON i.id = b.item_id
      WHERE i.status = 'active' AND i.end_time > datetime('now')
      GROUP BY i.id
      ORDER BY i.end_time ASC
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows);
    });
  }

  // Update item current price
  static updatePrice(itemId, newPrice, callback) {
    const query = `UPDATE items SET current_price = ? WHERE id = ?`;
    db.run(query, [newPrice, itemId], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { changes: this.changes });
    });
  }

  // Update item end time (for auto-snipe prevention)
  static updateEndTime(itemId, newEndTime, callback) {
    const query = `UPDATE items SET end_time = ? WHERE id = ?`;
    db.run(query, [newEndTime, itemId], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { changes: this.changes });
    });
  }

  // Close expired auctions
  static closeExpired(callback) {
    const query = `UPDATE items SET status = 'ended' WHERE end_time <= datetime('now') AND status = 'active'`;
    db.run(query, [], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { changes: this.changes });
    });
  }

  // Get items by seller
  static findBySeller(sellerId, callback) {
    const query = `
      SELECT i.*, 
             (SELECT COUNT(*) FROM bids WHERE item_id = i.id) as bid_count
      FROM items i
      WHERE i.seller_id = ?
      ORDER BY i.created_at DESC
    `;

    db.all(query, [sellerId], (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows);
    });
  }
}

module.exports = Item;
