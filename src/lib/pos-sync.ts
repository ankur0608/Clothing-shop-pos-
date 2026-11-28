// In-memory real-time sync store for pairing Mobile Phone Scanners with Laptop POS terminals

interface ScanEvent {
  id: string;
  barcode: string;
  timestamp: number;
}

interface PosSession {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  scans: ScanEvent[];
}

const globalStore = global as unknown as {
  posSessions?: Map<string, PosSession>;
};

if (!globalStore.posSessions) {
  globalStore.posSessions = new Map<string, PosSession>();
}

export const posSessions = globalStore.posSessions;

/**
 * Register a scan from mobile phone to a laptop POS session
 */
export function pushMobileScan(sessionId: string, barcode: string): ScanEvent {
  const cleanCode = barcode.trim();
  let session = posSessions.get(sessionId);

  if (!session) {
    session = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      scans: [],
    };
    posSessions.set(sessionId, session);
  }

  session.lastActivity = Date.now();

  const scanEvent: ScanEvent = {
    id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    barcode: cleanCode,
    timestamp: Date.now(),
  };

  session.scans.push(scanEvent);

  // Keep only the last 50 scans per session
  if (session.scans.length > 50) {
    session.scans = session.scans.slice(-50);
  }

  return scanEvent;
}

/**
 * Fetch new scans since a timestamp for a laptop POS session
 */
export function getNewScans(sessionId: string, sinceTimestamp = 0): ScanEvent[] {
  const session = posSessions.get(sessionId);
  if (!session) return [];

  return session.scans.filter((s) => s.timestamp > sinceTimestamp);
}

/**
 * Clean up old sessions older than 24 hours
 */
export function cleanupStaleSessions() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [id, session] of posSessions.entries()) {
    if (session.lastActivity < oneDayAgo) {
      posSessions.delete(id);
    }
  }
}
