// TODO think another good name for the file
const { Server } = require("socket.io");
let socketInstance;
let ioInstance;

function Handler(event, handler) {
  this.event = event;
  this.handler = handler;
  this.getEvent = () => {
    return this.event;
  };
  this.getHandler = (socket) => {
    return this.handler(socket);
  };
}
let debugging = false;
const _listeners = [];

const setDebugging = (deb) => (debugging = deb);

const addHandler = (eventName, handler) => {
  if (typeof eventName !== "string") throw Error("Event name must be a string");
  if (typeof handler !== "function") throw Error("Handler must be a function");
  _listeners.push(new Handler(eventName, handler));
};

const initInstance = (server) => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  
  ioInstance = io;

  io.on("connection", function (socket) {
    socketInstance = socket;
    if (debugging) {
      console.log("New connection: " + io.of("/").sockets.size);
      socket.onAny((m) => console.log({ m }));
    }
    socket.on("ping", (fn) => {
      if (typeof fn === "function") fn("pong");
    });
    for (let handler of _listeners) {
      socket.on(handler.getEvent(), handler.getHandler(socket));
    }
  });
};

const getSocket = () => socketInstance;

const getIoInstance = () => ioInstance;

const getClientRoomCount = (roomName) => {
  if (ioInstance && ioInstance.sockets.adapter.rooms.has(roomName)) {
    return ioInstance.sockets.adapter.rooms.get(roomName).size;
  }
  return 0;
};

module.exports = {
  initInstance,
  addHandler,
  setDebugging,
  getSocket,
  getIoInstance,
  getClientRoomCount,
};
