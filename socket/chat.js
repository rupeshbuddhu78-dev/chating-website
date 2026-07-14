/**
 * Chat message + typing + control events.
 */
const ChatLog = require('../models/ChatLog');
const { MAX_MESSAGE_LEN } = require('../config/constants');

module.exports = function registerChat(io, socket, engine) {
  socket.on('join', (data = {}) => {
    const name = String(data.name || 'Stranger').slice(0, 24);
    const gender = ['Male', 'Female', 'Other'].includes(data.gender) ? data.gender : '';
    const country = String(data.country || '').slice(0, 40);
    const language = String(data.language || '').slice(0, 20);
    const mode = ['text', 'voice', 'video'].includes(data.mode) ? data.mode : 'text';
    const filters = data.filters && typeof data.filters === 'object' ? {
      gender: ['Male', 'Female', 'Other'].includes(data.filters.gender) ? data.filters.gender : '',
      country: String(data.filters.country || '').slice(0, 40),
      language: String(data.filters.language || '').slice(0, 20)
    } : null;

    engine.setProfile(socket.id, {
      userId: data.userId || null,
      name,
      gender,
      country,
      language,
      isPremium: !!data.isPremium,
      mode,
      filters
    });
    engine.leave(socket.id, { notifyPartner: true });
    engine.tryMatch(socket.id);
  });

  socket.on('next', () => engine.leave(socket.id, { notifyPartner: true, requeue: true }));
  socket.on('stop', () => engine.leave(socket.id, { notifyPartner: true }));

  socket.on('chat-message', (payload) => {
    const partner = engine.getPartner(socket.id);
    if (!partner) return;
    let text = '';
    let type = 'text';
    let data = null;
    if (typeof payload === 'string') text = payload;
    else if (payload && typeof payload === 'object') {
      type = ['text', 'image', 'gif', 'sticker', 'emoji'].includes(payload.type) ? payload.type : 'text';
      text = String(payload.text || '').slice(0, MAX_MESSAGE_LEN);
      data = payload.data || null;
      if (type === 'image' && data && typeof data === 'string') {
        // data URL — enforce size (base64 length * 3/4)
        const size = Math.ceil((data.length * 3) / 4);
        if (size > 350 * 1024) return socket.emit('error-msg', 'Image too large (max 350KB)');
      }
    }
    if (!text && !data) return;
    io.to(partner).emit('chat-message', { type, text, data, at: Date.now() });

    const roomId = engine.getRoom(socket.id);
    if (roomId) ChatLog.findOneAndUpdate({ roomId }, { $inc: { messagesCount: 1 } }).catch(() => {});
  });

  socket.on('typing', (isTyping) => {
    const partner = engine.getPartner(socket.id);
    if (partner) io.to(partner).emit('typing', !!isTyping);
  });

  socket.on('media-state', (state) => {
    const partner = engine.getPartner(socket.id);
    if (partner) io.to(partner).emit('media-state', state);
  });
};
