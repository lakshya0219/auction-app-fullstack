const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "auction.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    starting_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    seller_id INTEGER NOT NULL,
    end_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (seller_id) REFERENCES users (id)
  )`);

  // Bids table with unique constraint to prevent race conditions
  db.run(`CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(item_id, amount, created_at)
  )`);

  db.run(`INSERT OR IGNORE INTO users (username, email) VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com'),
    ('bidder_pro', 'pro@example.com')`);

  db.run(`INSERT OR IGNORE INTO items (title, description, starting_price, current_price, seller_id, end_time) VALUES 
    ('Vintage Camera', 'Beautiful vintage camera from 1970s', 50.00, 50.00, 1, datetime('now', '+1 hour')),
    ('Smart Watch', 'Latest smartwatch with all features', 100.00, 100.00, 2, datetime('now', '+30 minutes')),
    ('Art Painting', 'Original oil painting by local artist', 200.00, 200.00, 1, datetime('now', '+2 hours'))`);
});

module.exports = db;
