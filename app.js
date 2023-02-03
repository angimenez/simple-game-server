const http = require("http");
const socket = require("./socket");
const { CANVAS_HEIGHT, CANVAS_WIDTH } = require("./constants");

const ROOM_NAME = "1234";

const requestListener = function (req, res) {
  res.writeHead(200);
  res.end("Welcome to shit game!");
};
const server = http.createServer(requestListener);

// Logic that I need to separate

const randomNumber = (min, max) => parseInt(Math.random() * (max - min) + min);

const ships = [];

const updateObj = (original, modified) => {
  for (let key in modified) {
    if (key !== "id") original[key] = modified[key];
  }
};

const addPlayer = (idSocket) => {
  const player = {
    id: idSocket,
    x: randomNumber(0, 700),
    y: randomNumber(0, 300),
    width: 50,
    height: 50,
    key_pressed: {},
    speed: 0.8,
  };
  ships.push(player);
  return player;
};

const removePlayer = (idPlayer) => {
  ships.splice(
    ships.findIndex(({ id }) => id === idPlayer),
    1
  );
};

socket.addHandler("joinGame", (socket) => (roomId, callback) => {
  socket.join(roomId);
  const player = addPlayer(socket.id);
  callback(ships, socket.id);
  socket.broadcast.to(ROOM_NAME).emit("newEnemy", player);
});

socket.addHandler("updateStatus", (socket) => (modified) => {
  const orig = ships.find(({ id }) => id === modified.id);
  if (orig) {
    updateObj(orig, modified);
    console.log(orig);
    socket.broadcast.to(ROOM_NAME).emit("updatedEnemy", orig);
  }
});

socket.setDebugging(true);
socket.initInstance(server);

server.listen(3000);

setInterval(() => {
  const io = socket.getIoInstance();
  for (let player of ships) {
    if (!io.sockets.adapter.rooms.has(player.id)) {
      removePlayer(player.id);
      io.to(ROOM_NAME).emit("userLeave", player.id);
    }
  }
}, 2000);
