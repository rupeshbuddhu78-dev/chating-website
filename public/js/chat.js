/**
 * QuickTalk — client-side chat, voice & video.
 * Handles Socket.IO messaging + WebRTC peer connection.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const landing = $('landing');
  const chat = $('chat');
  const messages = $('messages');
  const status = $('status');
  const remoteTag = $('remoteTag');
  const localVideo = $('localVideo');
  const remoteVideo = $('remoteVideo');
  const typingEl = $('typing');
  const qualityEl = $('quality');
  const onlineCount = $('onlineCount');

  const ICE = { iceServers: window.__ICE__ || [{ urls: 'stun:stun.l.google.com:19302' }] };
  const USER = window.__USER__ || null;

  let socket = null;
  let localStream = null;
  let pc = null;
  let mode = 'text';
  let currentRoom = null;
  let iAmInitiator = false;
  let usingFacing = 'user';
  let typingTimer = null;
  let reconnectTimer = null;
  let strangerAnon = null;

  // ---- Filters visibility (only premium users see) ----
  if (USER && USER.isPremium) $('premiumFilters')?.classList.remove('hidden');

  // ---- Emoji picker ----
  const EMOJIS = ['😀','😂','😍','😘','😎','🤔','😅','😢','😡','👍','👎','🙏','🔥','❤️','💯','🎉','🥳','😴','🤯','🤝','👀','✨','🌹','☕','🍕','🎧','⚡','🌟','💫','🌍','🚀','🎮'];
  const picker = $('emojiPicker');
  EMOJIS.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.onclick = () => {
      $('msgInput').value += e;
      picker.classList.add('hidden');
    };
    picker.appendChild(b);
  });
  $('emojiBtn').onclick = () => picker.classList.toggle('hidden');

  // ---- Landing form ----
  $('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('name').value.trim() || 'Stranger';
    const gender = $('gender').value;
    const country = $('country').value.trim();
    mode = document.querySelector('input[name=mode]:checked').value;

    const filters = {
      gender: $('fGender')?.value || '',
      country: $('fCountry')?.value?.trim() || '',
      language: $('fLanguage')?.value?.trim() || ''
    };

    landing.classList.add('hidden');
    chat.classList.remove('hidden');

    // Camera + mic for video/voice
    if (mode === 'video' || mode === 'voice') {
      try {
        const constraints = { audio: true, video: mode === 'video' ? { width: 1280, height: 720, facingMode: usingFacing } : false };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mode === 'video') localVideo.srcObject = localStream;
      } catch (err) {
        addSystem('Camera/mic permission denied. Falling back to text.');
        mode = 'text';
      }
    }

    // If not video, hide videos area
    if (mode !== 'video') $('videos').style.display = 'none';
    if (mode === 'text') $('mediaControls').style.display = 'none';

    // Connect socket
    connectSocket({ name, gender, country, filters });
  });

  function connectSocket(profile) {
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      setStatus('Searching…', 'searching');
      socket.emit('join', {
        userId: USER?.id || null,
        isPremium: !!USER?.isPremium,
        mode,
        name: profile.name,
        gender: profile.gender,
        country: profile.country,
        language: profile.filters.language,
        filters: USER?.isPremium ? profile.filters : null
      });
    });
    socket.on('welcome', () => {});
    socket.on('online-count', (n) => { if (onlineCount) onlineCount.textContent = n; });
    socket.on('waiting', () => setStatus('Searching for stranger…', 'searching'));
    socket.on('matched', async ({ roomId, partner, initiator }) => {
      currentRoom = roomId;
      iAmInitiator = initiator;
      strangerAnon = partner.name || 'Stranger';
      remoteTag.textContent = strangerAnon + (partner.isPremium ? ' ★' : '');
      setStatus('Connected · ' + strangerAnon, 'connected');
      addSystem('You are now chatting with ' + strangerAnon);
      clearMessages();
      if (mode === 'video' || mode === 'voice') await setupPeer();
    });
    socket.on('partner-left', () => {
      setStatus('Stranger left. Click Next.', 'left');
      addSystem('Stranger disconnected.');
      teardownPeer();
      remoteVideo.srcObject = null;
    });
    socket.on('chat-message', (m) => {
      if (typeof m === 'string') return addMessage(m, false);
      if (m.type === 'image' && m.data) {
        addMessage('', false, { image: m.data });
      } else {
        addMessage(m.text || '', false);
      }
    });
    socket.on('typing', (t) => {
      typingEl.textContent = t ? strangerAnon + ' is typing…' : '';
    });
    socket.on('signal', handleSignal);
    socket.on('call-quality', (q) => {
      if (qualityEl) qualityEl.textContent = q ? `Q: ${q}` : '';
    });
    socket.on('error-msg', (m) => addSystem('⚠ ' + m));
    socket.on('disconnect', () => {
      setStatus('Disconnected. Reconnecting…', 'left');
      reconnectTimer = setTimeout(() => window.location.reload(), 3000);
    });
  }

  // ---- WebRTC ----
  async function setupPeer() {
    teardownPeer();
    pc = new RTCPeerConnection(ICE);
    if (localStream) localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.ontrack = (ev) => {
      remoteVideo.srcObject = ev.streams[0];
    };
    pc.onicecandidate = (ev) => {
      if (ev.candidate) socket.emit('signal', { type: 'candidate', data: ev.candidate });
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        setStatus('Connection lost. Next.', 'left');
      }
    };

    if (iAmInitiator) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: mode === 'video' });
      await pc.setLocalDescription(offer);
      socket.emit('signal', { type: 'offer', data: offer });
    }
    monitorQuality();
  }

  async function handleSignal({ type, data }) {
    if (!pc) await setupPeer();
    try {
      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { type: 'answer', data: answer });
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      }
    } catch (e) {
      console.warn('signal error', e);
    }
  }

  function teardownPeer() {
    if (pc) {
      try { pc.close(); } catch (_e) {}
      pc = null;
    }
  }

  function monitorQuality() {
    if (!pc) return;
    const iv = setInterval(async () => {
      if (!pc || pc.connectionState === 'closed') return clearInterval(iv);
      try {
        const stats = await pc.getStats();
        let inbound = null;
        stats.forEach((r) => { if (r.type === 'inbound-rtp' && r.kind === 'video') inbound = r; });
        if (inbound) {
          const loss = inbound.packetsLost || 0;
          const jitter = inbound.jitter || 0;
          const q = loss > 30 ? 'Poor' : loss > 10 ? 'Fair' : 'Good';
          qualityEl.textContent = 'Q: ' + q;
          socket.emit('call-quality', q);
        }
      } catch (_e) {}
    }, 3000);
  }

  // ---- Chat UI ----
  $('msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('msgInput').value.trim();
    if (!val) return;
    socket.emit('chat-message', { type: 'text', text: val });
    addMessage(val, true);
    $('msgInput').value = '';
  });
  $('msgInput').addEventListener('input', () => {
    socket.emit('typing', true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => socket.emit('typing', false), 1200);
  });

  $('imgBtn').onclick = () => $('imgInput').click();
  $('imgInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 350 * 1024) return alert('Image too large (max 350KB)');
    const reader = new FileReader();
    reader.onload = () => {
      socket.emit('chat-message', { type: 'image', data: reader.result });
      addMessage('', true, { image: reader.result });
    };
    reader.readAsDataURL(file);
  });

  $('nextBtn').onclick = () => {
    socket.emit('next');
    setStatus('Searching…', 'searching');
    clearMessages();
    teardownPeer();
    remoteVideo.srcObject = null;
  };
  $('stopBtn').onclick = () => {
    socket.emit('stop');
    setStatus('Stopped.', 'left');
    teardownPeer();
    remoteVideo.srcObject = null;
    setTimeout(() => window.location.reload(), 800);
  };

  // ---- Media controls ----
  $('micBtn').onclick = () => {
    if (!localStream) return;
    const t = localStream.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    $('micBtn').classList.toggle('off', !t.enabled);
    socket?.emit('media-state', { mic: t.enabled });
  };
  $('camBtn').onclick = () => {
    if (!localStream) return;
    const t = localStream.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    $('camBtn').classList.toggle('off', !t.enabled);
    socket?.emit('media-state', { cam: t.enabled });
  };
  $('swapBtn').onclick = async () => {
    if (!localStream || mode !== 'video') return;
    usingFacing = usingFacing === 'user' ? 'environment' : 'user';
    try {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: usingFacing } });
      localVideo.srcObject = localStream;
      const sender = pc?.getSenders().find((s) => s.track?.kind === 'video');
      const newTrack = localStream.getVideoTracks()[0];
      if (sender && newTrack) sender.replaceTrack(newTrack);
    } catch (e) {
      addSystem('Switch camera failed');
    }
  };
  $('fsBtn').onclick = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  // ---- Report / Block ----
  $('reportBtn').onclick = () => $('reportModal').classList.remove('hidden');
  $('reportCancel').onclick = () => $('reportModal').classList.add('hidden');
  $('reportSubmit').onclick = async () => {
    const reason = $('reportReason').value;
    const details = $('reportDetails').value;
    if (!reason) return alert('Choose reason');
    await fetch('/api/report', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, details, roomId: currentRoom, reportedAnon: strangerAnon })
    });
    $('reportModal').classList.add('hidden');
    addSystem('Report submitted. Thank you.');
  };
  $('blockBtn').onclick = async () => {
    if (!USER) return alert('Login to block users.');
    await fetch('/api/block', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedAnonId: strangerAnon })
    });
    addSystem('Blocked. Finding next…');
    $('nextBtn').click();
  };

  // ---- helpers ----
  function setStatus(text, cls) {
    status.textContent = text;
    status.className = 'status ' + (cls || '');
  }
  function addMessage(text, me, extra) {
    const d = document.createElement('div');
    d.className = 'msg ' + (me ? 'me' : '');
    if (extra?.image) {
      const img = document.createElement('img');
      img.src = extra.image;
      d.appendChild(img);
    } else {
      d.textContent = text;
    }
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }
  function addSystem(text) {
    const d = document.createElement('div');
    d.className = 'msg system';
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }
  function clearMessages() {
    messages.innerHTML = '';
  }
})();
