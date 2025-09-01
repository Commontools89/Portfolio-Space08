// Simple cross-window sync using localStorage
// Broadcasts camera/controls state periodically and on changes

const CHANNEL_KEY = 'planet_orb_sync_v1';

export function createOrbSync(options) {
  const { getState, applyState, instanceId = randomId(), throttleMs = 80 } = options;
  let lastSentAt = 0;
  let isApplyingRemote = false;

  function onStorage(e) {
    if (e.key !== CHANNEL_KEY || !e.newValue) return;
    try {
      const message = JSON.parse(e.newValue);
      if (!message || message.instanceId === instanceId) return; // ignore self
      isApplyingRemote = true;
      applyState(message.payload);
    } finally {
      isApplyingRemote = false;
    }
  }

  function broadcast(force = false) {
    if (isApplyingRemote) return;
    const now = Date.now();
    if (!force && now - lastSentAt < throttleMs) return;
    lastSentAt = now;
    const payload = getState();
    const message = { instanceId, ts: now, payload };
    try {
      localStorage.setItem(CHANNEL_KEY, JSON.stringify(message));
      // write a second time to trigger events in same tab in some browsers
      localStorage.removeItem(CHANNEL_KEY);
      localStorage.setItem(CHANNEL_KEY, JSON.stringify(message));
    } catch (_) {}
  }

  function start() {
    window.addEventListener('storage', onStorage);
  }

  function stop() {
    window.removeEventListener('storage', onStorage);
  }

  return { start, stop, broadcast };
}

function randomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}


