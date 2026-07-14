/**
 * WebRTC signaling relay — offers, answers, ICE candidates.
 * Client sends { type: 'offer'|'answer'|'candidate', data } and we forward
 * to the paired partner.
 */
module.exports = function registerSignal(io, socket, engine) {
  socket.on('signal', (payload) => {
    const partner = engine.getPartner(socket.id);
    if (!partner) return;
    io.to(partner).emit('signal', payload);
  });

  socket.on('call-quality', (q) => {
    const partner = engine.getPartner(socket.id);
    if (partner) io.to(partner).emit('call-quality', q);
  });
};
