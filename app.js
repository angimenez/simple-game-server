const http = require("http");
const socket = require("./socket");
const { CANVAS_HEIGHT, CANVAS_WIDTH } = require("./constants");

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
  ships.slice(ships.findIndex(({ id }) => id === idPlayer));
};

socket.addHandler("joinGame", (socket) => (roomId, callback) => {
  socket.join(roomId);
  const player = addPlayer(socket.id);
  callback(ships, socket.id);
  socket.broadcast.to("1234").emit("newEnemy", player);
});

socket.addHandler("updateStatus", (socket) => (modified) => {
  const orig = ships.find(({ id }) => id === modified.id);
  if (orig) {
    updateObj(orig, modified);
    console.log(orig);
    socket.broadcast.to("1234").emit("updatedEnemy", orig);
  }
});

socket.addHandler("disconect", (socket) => () => {
  removePlayer(socket.id);
});

/*
socket.addHandler("JoinEvent", (socket) => (data) => {
    socket.join(data.eventId);
    Controller.userController.eventAudioListing(data);
  });
  socket.addHandler("JoinEventAsAdmin", (socket) => (data) => {
    socket.join(`${data.eventId}/admin`);
  });
  socket.addHandler("RequestEventDataFromAdmin", (socket) => (data) => {
    socket.join(`${data.eventId}/socket/${data.socketId}`);
    socket.broadcast
      .to(`${data.eventId}/admin`)
      .emit(
        "RequestEventDataFromAdmin",
        `${data.eventId}/socket/${data.socketId}`
      );
  });
  socket.addHandler("SendEventDataToClient", (socket) => (data) => {
    if (data.socketRoom)
      socket.broadcast
        .to(data.socketRoom)
        .emit("SendEventDataToClient", data.eventData);
  });
*/

socket.setDebugging(true);
socket.initInstance(server);

server.listen(3000);
