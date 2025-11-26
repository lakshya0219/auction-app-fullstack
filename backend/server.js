const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

require("./database");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/api/items", require("./routes/items"));
app.use("/api/bids", require("./routes/bids"));

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

app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
