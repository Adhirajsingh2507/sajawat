/**
 * Database health probe for the readiness endpoint (AD-4).
 *
 * Two-tier check:
 *  1. Cheap: `connection.readyState` (no network round-trip).
 *  2. Deep: a bounded `admin().ping()` to catch a "connected but unresponsive"
 *     server. The ping is raced against a short timeout so a stalled server can
 *     never hang the health response.
 */
import mongoose from 'mongoose';

export type DbConnectionState = 'disconnected' | 'connected' | 'connecting' | 'disconnecting';

export interface DbHealth {
  /** Human-readable connection state derived from Mongoose `readyState`. */
  state: DbConnectionState;
  /** True only when connected *and* the server answered a ping within the timeout. */
  ok: boolean;
}

// Mongoose readyState codes -> labels.
const STATE_LABELS: Record<number, DbConnectionState> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

function stateLabel(readyState: number): DbConnectionState {
  return STATE_LABELS[readyState] ?? 'disconnected';
}

/** Resolve to `false` (never reject) if the ping does not complete in time. */
async function pingWithTimeout(timeoutMs: number): Promise<boolean> {
  const db = mongoose.connection.db;
  if (db === undefined) {
    return false;
  }
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      resolve(false);
    }, timeoutMs);
  });
  try {
    const ping = db
      .admin()
      .ping()
      .then(() => true)
      .catch(() => false);
    return await Promise.race([ping, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/**
 * Report database health. The cheap state check gates the deep ping: if we are
 * not in the `connected` state there is no point pinging.
 */
export async function checkDatabaseHealth(pingTimeoutMs = 1_000): Promise<DbHealth> {
  const state = stateLabel(mongoose.connection.readyState);
  if (state !== 'connected') {
    return { state, ok: false };
  }
  const ok = await pingWithTimeout(pingTimeoutMs);
  return { state, ok };
}
