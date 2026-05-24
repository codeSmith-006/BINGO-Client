const SESSION_KEY = 'bingo-session-v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readSession() {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage write failures.
  }
}

export function clearSession() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

function getSetupBoardKey(roomId, playerId) {
  return `bingo-setup-${roomId}-${playerId}`;
}

export function readSetupBoard(roomId, playerId) {
  if (!canUseStorage() || !roomId || !playerId) return null;

  try {
    const raw = window.localStorage.getItem(getSetupBoardKey(roomId, playerId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSetupBoard(roomId, playerId, board) {
  if (!canUseStorage() || !roomId || !playerId) return;

  try {
    window.localStorage.setItem(getSetupBoardKey(roomId, playerId), JSON.stringify(board));
  } catch {
    // Ignore storage write failures.
  }
}

export function clearSetupBoard(roomId, playerId) {
  if (!canUseStorage() || !roomId || !playerId) return;

  try {
    window.localStorage.removeItem(getSetupBoardKey(roomId, playerId));
  } catch {
    // Ignore storage cleanup failures.
  }
}
