const db = require("../database");

class User {
  // Create new user
  static create(username, email, callback) {
    const query = `INSERT INTO users (username, email) VALUES (?, ?)`;
    db.run(query, [username, email], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, { id: this.lastID, username, email });
    });
  }

  // Find user by ID
  static findById(id, callback) {
    const query = `SELECT * FROM users WHERE id = ?`;
    db.get(query, [id], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row);
    });
  }

  // Find user by username
  static findByUsername(username, callback) {
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row);
    });
  }

  // Find user by email
  static findByEmail(email, callback) {
    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
      if (err) {
        return callback(err);
      }
      callback(null, row);
    });
  }

  // Get all users
  static findAll(callback) {
    const query = `SELECT * FROM users ORDER BY created_at DESC`;
    db.all(query, [], (err, rows) => {
      if (err) {
        return callback(err);
      }
      callback(null, rows);
    });
  }
}

module.exports = User;
