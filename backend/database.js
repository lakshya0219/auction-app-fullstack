const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "auction.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables with updated schema
const initializeDatabase = () => {
  db.serialize(() => {
    // Drop existing tables if they exist (for clean setup)
    db.run(`DROP TABLE IF EXISTS bids`);
    db.run(`DROP TABLE IF EXISTS items`);
    db.run(`DROP TABLE IF EXISTS users`);

    // Users table with password column
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Items table
    db.run(`CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      starting_price DECIMAL(10,2) NOT NULL,
      current_price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      seller_id INTEGER NOT NULL,
      end_time DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      bid_increment DECIMAL(10,2) DEFAULT 1.00,
      FOREIGN KEY (seller_id) REFERENCES users (id)
    )`);

    // Bids table
    db.run(`CREATE TABLE bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(item_id, amount, created_at)
    )`);

    // Insert sample users with hashed passwords
    const hashedPassword = bcrypt.hashSync("password123", 10);

    db.run(
      `INSERT INTO users (username, email, password) VALUES 
      ('john_doe', 'john@example.com', ?),
      ('jane_smith', 'jane@example.com', ?),
      ('bidder_pro', 'pro@example.com', ?),
      ('auction_lover', 'lover@example.com', ?)`,
      [hashedPassword, hashedPassword, hashedPassword, hashedPassword],
      function (err) {
        if (err) {
          console.log("Error inserting users:", err.message);
        } else {
          console.log("Sample users created successfully");

          // Insert sample items after users are created
          insertSampleItems();
        }
      }
    );
  });
};

const insertSampleItems = () => {
  const now = new Date();
  const sampleItems = [
    // Electronics - Active for next few hours
    [
      "iPhone 15 Pro",
      "Brand new iPhone 15 Pro 256GB, sealed box",
      "Electronics",
      999.0,
      999.0,
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
      1,
      new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      10.0,
    ],
    [
      "MacBook Air M2",
      "2023 MacBook Air with M2 chip, 8GB RAM, 256GB SSD",
      "Electronics",
      1199.0,
      1199.0,
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400",
      2,
      new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      25.0,
    ],
    [
      "Sony Headphones",
      "Sony WH-1000XM4 wireless noise-canceling headphones",
      "Electronics",
      299.0,
      299.0,
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
      1,
      new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      5.0,
    ],
    [
      "Gaming Laptop",
      "ASUS ROG Gaming Laptop, RTX 4060, 16GB RAM",
      "Electronics",
      1499.0,
      1499.0,
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
      3,
      new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      20.0,
    ],

    // Collectibles
    [
      "Vintage Watch",
      "Classic vintage wristwatch from 1960s, working condition",
      "Collectibles",
      450.0,
      450.0,
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400",
      3,
      new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString(),
      10.0,
    ],
    [
      "Rare Coin Collection",
      "Set of rare historical coins from different eras",
      "Collectibles",
      800.0,
      800.0,
      "https://images.unsplash.com/photo-1606293458395-9b5d6e73a6b9?w=400",
      2,
      new Date(now.getTime() + 15 * 60 * 60 * 1000).toISOString(),
      25.0,
    ],
    [
      "Antique Vase",
      "Beautiful Chinese antique vase from Qing Dynasty",
      "Collectibles",
      1200.0,
      1200.0,
      "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
      1,
      new Date(now.getTime() + 20 * 60 * 60 * 1000).toISOString(),
      50.0,
    ],

    // Art
    [
      "Oil Painting",
      "Original landscape oil painting by local artist",
      "Art",
      350.0,
      350.0,
      "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400",
      4,
      new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      10.0,
    ],
    [
      "Abstract Art",
      "Modern abstract art piece, vibrant colors",
      "Art",
      275.0,
      275.0,
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
      3,
      new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      5.0,
    ],

    // Jewelry
    [
      "Diamond Ring",
      "Elegant diamond ring, 1 carat, white gold",
      "Jewelry",
      2500.0,
      2500.0,
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
      2,
      new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
      100.0,
    ],
    [
      "Pearl Necklace",
      "Luxurious pearl necklace, perfect condition",
      "Jewelry",
      680.0,
      680.0,
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400",
      1,
      new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString(),
      15.0,
    ],

    // Sports
    [
      "Basketball Shoes",
      "Limited edition basketball shoes, size 10",
      "Sports",
      180.0,
      180.0,
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      4,
      new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      5.0,
    ],
    [
      "Tennis Racket",
      "Professional tennis racket, used by champion",
      "Sports",
      220.0,
      220.0,
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431cb?w=400",
      3,
      new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString(),
      10.0,
    ],
  ];

  const insertItem = `INSERT INTO items 
    (title, description, category, starting_price, current_price, image_url, seller_id, end_time, bid_increment) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  sampleItems.forEach((item, index) => {
    db.run(insertItem, item, function (err) {
      if (err) {
        console.log("Error inserting item:", err.message);
      } else if (index === sampleItems.length - 1) {
        console.log("Sample items created successfully");
      }
    });
  });
};

// Initialize the database
initializeDatabase();

module.exports = db;
