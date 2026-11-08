
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

app.get("/", (req, res) => {
  res.send("BATTLE ZONE X SERVER ONLINE");
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinRoom", ({ room, name }) => {
    if (!room || !name) return;

    if (!rooms[room]) rooms[room] = {};

    if (Object.keys(rooms[room]).length >= 10) {
      socket.emit("roomFull");
      return;
    }

    socket.join(room);

    rooms[room][socket.id] = {
      id: socket.id,
      name: String(name).slice(0, 20),
      x: 0,
      y: 0,
      health: 100
    };

    socket.data.room = room;

    io.to(room).emit("playersUpdate", rooms[room]);
    console.log(name, "joined", room);
  });

  socket.on("playerMove", (position) => {
    const room = socket.data.room;
    if (!room || !rooms[room]?.[socket.id]) return;

    const player = rooms[room][socket.id];

    player.x = Number(position.x) || 0;
    player.y = Number(position.y) || 0;

    socket.to(room).emit("playerMoved", player);
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;

    if (room && rooms[room]) {
      delete rooms[room][socket.id];

      io.to(room).emit("playersUpdate", rooms[room]);

      if (Object.keys(rooms[room]).length === 0) {
        delete rooms[room];
      }
    }

    console.log("Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("BATTLE ZONE X running on port", PORT);
});
