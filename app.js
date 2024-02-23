const http = require("http");
const socket = require("./socket");
const { CANVAS_HEIGHT, CANVAS_WIDTH } = require("./constants");
const { Ship } = require("./prototypes");
const time = require("./time");

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
  original["key_pressed"] = modified["key_pressed"];
  // for (let key in modified) {
  // if (key !== "id") original[key] = modified[key];
  // }
};

const addPlayer = (idSocket) => {
  const player = new Ship(
    idSocket,
    randomNumber(0, 700),
    randomNumber(0, 300),
    50,
    50,
    {},
    0.8,
    0.8
  );
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

socket.addHandler("updateStatus", (socket) => (modified, cb) => {
  const orig = ships.find(({ id }) => id === modified.id);
  if (orig) {
    updateObj(orig, modified);
    socket.broadcast.to(ROOM_NAME).emit("updatedEnemy", orig);
    if (typeof cb === "function") {
      cb();
    }
  }
});

socket.setDebugging(true);
socket.initInstance(server);

server.listen(3000, () => {
  console.log("Super Game Server corriendo en el puerto 3000");

  time.initializeTime();
  gameLoop();
});

function updateShips() {
  const io = socket.getIoInstance();
  for (let player of ships) {
    if (!io.sockets.adapter.rooms.has(player.id)) {
      removePlayer(player.id);
      io.to(ROOM_NAME).emit("userLeave", player.id);
    } else {
      player.updateStatus(ships);
      player.updateShield();
      io.to(ROOM_NAME).emit("updatedStatusServer", player);
    }
  }
}

const gameLoop = () => {
  time.updateDeltaTime();
  updateShips();
  setTimeout(() => gameLoop(), 1000 / 60);
};
