/**
 * Matching engine with:
 *   - Two priority queues: premium (front) + free
 *   - Optional filters: gender, country, language
 *   - Auto-reconnect / next / skip
 *   - Block-aware pairing
 */
const { v4: uuid } = require('uuid');
const Block = require('../models/Block');
const ChatLog = require('../models/ChatLog');

module.exports = function matchingEngine(io) {
  // socketId -> profile { userId?, name, gender, country, language, isPremium, mode, filters }
  const profiles = new Map();
  const partners = new Map(); // socketId -> partnerId
  const rooms = new Map(); // roomId -> [a,b]
  const waitingPremium = [];
  const waitingFree = [];

  function expose() {
    return {
      waitingCount: waitingPremium.length + waitingFree.length,
      roomsCount: rooms.size
    };
  }
  io.sockets && io.sockets.server && io.sockets.server.set?.('matchState', expose());

  function removeFromQueues(id) {
    let i = waitingPremium.indexOf(id);
    if (i !== -1) waitingPremium.splice(i, 1);
    i = waitingFree.indexOf(id);
    if (i !== -1) waitingFree.splice(i, 1);
  }

  function isCompatible(a, b) {
    const pa = profiles.get(a);
    const pb = profiles.get(b);
    if (!pa || !pb) return false;
    if (pa.mode !== pb.mode) return false; // must want same mode (text / video / voice)
    // A's premium filters apply to B (only premium may filter)
    if (pa.isPremium && pa.filters) {
      if (pa.filters.gender && pb.gender && pa.filters.gender !== pb.gender) return false;
      if (pa.filters.country && pb.country && pa.filters.country !== pb.country) return false;
      if (pa.filters.language && pb.language && pa.filters.language !== pb.language) return false;
    }
    if (pb.isPremium && pb.filters) {
      if (pb.filters.gender && pa.gender && pb.filters.gender !== pa.gender) return false;
      if (pb.filters.country && pa.country && pb.filters.country !== pa.country) return false;
      if (pb.filters.language && pa.language && pb.filters.language !== pa.language) return false;
    }
    return true;
  }

  async function isBlocked(a, b) {
    const pa = profiles.get(a);
    const pb = profiles.get(b);
    if (!pa || !pb) return false;
    if (!pa.userId && !pb.userId) return false;
    try {
      const q = [];
      if (pa.userId && pb.userId) q.push({ blocker: pa.userId, blockedUser: pb.userId }, { blocker: pb.userId, blockedUser: pa.userId });
      const found = q.length ? await Block.exists({ $or: q }) : null;
      return !!found;
    } catch (_e) {
      return false;
    }
  }

  async function pair(a, b) {
    partners.set(a, b);
    partners.set(b, a);
    const roomId = 'r_' + uuid().slice(0, 12);
    rooms.set(roomId, [a, b]);
    const sa = io.sockets.sockets.get(a);
    const sb = io.sockets.sockets.get(b);
    if (sa) sa.join(roomId);
    if (sb) sb.join(roomId);
    if (sa) sa.data.roomId = roomId;
    if (sb) sb.data.roomId = roomId;

    const pa = profiles.get(a) || {};
    const pb = profiles.get(b) || {};
    io.to(a).emit('matched', {
      roomId,
      partner: { name: pb.name, gender: pb.gender, country: pb.country, isPremium: !!pb.isPremium },
      initiator: true
    });
    io.to(b).emit('matched', {
      roomId,
      partner: { name: pa.name, gender: pa.gender, country: pa.country, isPremium: !!pa.isPremium },
      initiator: false
    });

    try {
      await ChatLog.create({
        roomId,
        participants: [pa.userId || a, pb.userId || b],
        mode: pa.mode || 'text'
      });
    } catch (_e) {}
  }

  async function tryMatch(id) {
    if (partners.has(id)) return;
    const p = profiles.get(id);
    if (!p) return;
    // Search premium queue first, then free
    const queues = [waitingPremium, waitingFree];
    for (const q of queues) {
      for (let i = 0; i < q.length; i++) {
        const other = q[i];
        if (other === id) continue;
        if (!io.sockets.sockets.get(other)) {
          q.splice(i, 1);
          i--;
          continue;
        }
        if (partners.has(other)) continue;
        if (!isCompatible(id, other)) continue;
        if (await isBlocked(id, other)) continue;
        q.splice(i, 1);
        await pair(id, other);
        return;
      }
    }
    // No match — join queue
    removeFromQueues(id);
    (p.isPremium ? waitingPremium : waitingFree).push(id);
    io.to(id).emit('waiting');
  }

  function leave(id, { notifyPartner = true, requeue = false } = {}) {
    const partnerId = partners.get(id);
    if (partnerId) {
      partners.delete(id);
      partners.delete(partnerId);
      const roomId = io.sockets.sockets.get(id)?.data?.roomId || io.sockets.sockets.get(partnerId)?.data?.roomId;
      if (roomId) {
        rooms.delete(roomId);
        io.sockets.sockets.get(id)?.leave(roomId);
        io.sockets.sockets.get(partnerId)?.leave(roomId);
        ChatLog.findOneAndUpdate({ roomId }, { endedAt: new Date() }).catch(() => {});
      }
      if (notifyPartner) io.to(partnerId).emit('partner-left');
    }
    removeFromQueues(id);
    if (requeue) tryMatch(id);
  }

  function setProfile(id, profile) {
    profiles.set(id, profile);
  }
  function getPartner(id) {
    return partners.get(id);
  }
  function getRoom(id) {
    return io.sockets.sockets.get(id)?.data?.roomId;
  }
  function stats() {
    return expose();
  }

  return { tryMatch, leave, setProfile, getPartner, getRoom, stats };
};
