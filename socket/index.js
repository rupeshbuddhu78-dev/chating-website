/**
 * Socket.IO entrypoint — registers matching + chat + WebRTC signaling handlers.
 */
const matchingEngine = require('./matching');
const registerChat = require('./chat');
const registerSignal = require('./signal');

module.exports = function registerSockets(io) {
  const engine = matchingEngine(io);

  io.on('connection', (socket) => {
    // Track for online count
    socket.data = socket.data || {};

    // Send ICE server list on connect (fetched from server so TURN creds stay server-side)
    socket.emit('welcome', { id: socket.id });

    registerChat(io, socket, engine);
    registerSignal(io, socket, engine);

    socket.on('disconnect', () => {
      engine.leave(socket.id, { notifyPartner: true });
    });
  });

  // Broadcast online count every 10s
  setInterval(() => {
    io.emit('online-count', io.engine.clientsCount);
  }, 10000);
};
