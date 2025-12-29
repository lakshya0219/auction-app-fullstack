const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database");

const router = express.Router();
const JWT_SECRET = "your-secret-key-change-in-production";

// Register new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    db.get(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (row) {
          return res
            .status(400)
            .json({ error: "Username or email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.run(
          "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
          [username, email, hashedPassword],
          function (err) {
            if (err) {
              return res.status(500).json({ error: "Failed to create user" });
            }

            // Generate JWT token
            const token = jwt.sign(
              { userId: this.lastID, username },
              JWT_SECRET,
              { expiresIn: "24h" }
            );

            res.json({
              message: "User created successfully",
              token,
              user: { id: this.lastID, username, email },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Login user
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        res.json({
          message: "Login successful",
          token,
          user: { id: user.id, username: user.username, email: user.email },
        });
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    }
  );
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

module.exports = { router, authenticateToken };
