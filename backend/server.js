const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

// Initialize database
require("./database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.use("/api/auth", require("./routes/auth").router);
app.use("/api/items", require("./routes/items"));
app.use("/api/bids", require("./routes/bids"));

// Socket.io for real-time updates
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinItem", (itemId) => {
    socket.join(`item_${itemId}`);
    console.log(`User ${socket.id} joined item ${itemId}`);
  });

  socket.on("leaveItem", (itemId) => {
    socket.leave(`item_${itemId}`);
    console.log(`User ${socket.id} left item ${itemId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io available to routes
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Close expired auctions every minute
setInterval(() => {
  const db = require("./database");
  db.run(
    `UPDATE items SET status = 'ended' WHERE end_time <= datetime('now') AND status = 'active'`,
    (err) => {
      if (err) console.error("Error closing expired auctions:", err);
    }
  );
}, 60000);

module.exports = { app, io };
