import 'dotenv/config';
import crypto from 'node:crypto';
import { getDatabase } from './db';


export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  } catch {
    return false;
  }
}

// 5 failed attempts per 15 minutes limit
export function checkRateLimit(identifier: string): { allowed: boolean; remainingSeconds?: number } {
  const db = getDatabase();
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;

  const row = db.prepare('SELECT * FROM login_attempts WHERE identifier = ?').get(identifier) as {
    identifier: string;
    attempts: number;
    last_attempt_at: number;
    blocked_until: number;
  } | undefined;

  if (row) {
    if (row.blocked_until > now) {
      const remainingSeconds = Math.ceil((row.blocked_until - now) / 1000);
      return { allowed: false, remainingSeconds };
    }

    if (now - row.last_attempt_at > fifteenMin) {
      // Reset attempts window
      db.prepare('UPDATE login_attempts SET attempts = 0, blocked_until = 0 WHERE identifier = ?').run(identifier);
    }
  }

  return { allowed: true };
}

export function recordFailedAttempt(identifier: string) {
  const db = getDatabase();
  const now = Date.now();
  const fifteenMin = 15 * 60 * 1000;

  const row = db.prepare('SELECT * FROM login_attempts WHERE identifier = ?').get(identifier) as {
    identifier: string;
    attempts: number;
  } | undefined;

  if (!row) {
    db.prepare('INSERT INTO login_attempts (identifier, attempts, last_attempt_at, blocked_until) VALUES (?, ?, ?, ?)').run(
      identifier,
      1,
      now,
      0
    );
  } else {
    const newAttempts = row.attempts + 1;
    let blockedUntil = 0;
    if (newAttempts >= 5) {
      blockedUntil = now + fifteenMin;
    }
    db.prepare('UPDATE login_attempts SET attempts = ?, last_attempt_at = ?, blocked_until = ? WHERE identifier = ?').run(
      newAttempts,
      now,
      blockedUntil,
      identifier
    );
  }
}

export function clearFailedAttempts(identifier: string) {
  const db = getDatabase();
  db.prepare('DELETE FROM login_attempts WHERE identifier = ?').run(identifier);
}

export function createSession(userId: string, deviceInfo: string, ip: string): string {
  const db = getDatabase();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

  db.prepare(
    'INSERT INTO sessions (id, user_id, device_info, ip, created_at, last_active, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(sessionId, userId, deviceInfo, ip, now, now, expiresAt);

  return sessionId;
}

export function getSessionUser(sessionId: string): { user: Record<string, unknown>; progress: Record<string, unknown> } | null {
  if (!sessionId) return null;
  const db = getDatabase();
  const now = Date.now();

  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?').get(sessionId, now) as {
    user_id: string;
  } | undefined;

  if (!session) return null;

  // Touch last active
  db.prepare('UPDATE sessions SET last_active = ? WHERE id = ?').run(now, sessionId);

  const user = db.prepare(`
    SELECT id, nick, email, avatar, is_guest, locale, unit_system, theme, sound_enabled, haptic_enabled, privacy,
           onboarding_completed, mic_enabled, camera_enabled, push_to_talk, show_skeleton, mirror_video, created_at
    FROM users WHERE id = ?
  `).get(session.user_id) as Record<string, unknown> | undefined;
  if (!user) return null;

  // Format user object for client consumption
  const formattedUser = {
    id: user.id as string,
    nick: user.nick as string,
    email: user.email as string | undefined,
    avatar: (user.avatar as string) || '⚡',
    createdAt: user.created_at as number,
    isGuest: Boolean(user.is_guest),
    onboardingCompleted: Boolean(user.onboarding_completed),
    settings: {
      language: (user.locale as string) || 'uk',
      theme: (user.theme as string) || 'dark',
      soundEnabled: Boolean(user.sound_enabled),
      hapticEnabled: Boolean(user.haptic_enabled),
      notificationsEnabled: true,
      privacy: (user.privacy as string) || 'public',
      micEnabled: user.mic_enabled !== undefined ? Boolean(user.mic_enabled) : true,
      cameraEnabled: user.camera_enabled !== undefined ? Boolean(user.camera_enabled) : true,
      pushToTalk: Boolean(user.push_to_talk),
      showSkeleton: user.show_skeleton !== undefined ? Boolean(user.show_skeleton) : true,
      mirrorVideo: user.mirror_video !== undefined ? Boolean(user.mirror_video) : true
    }
  };

  let progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(session.user_id) as Record<string, unknown> | undefined;
  if (!progress) {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(
      'INSERT INTO progress (user_id, xp, level, streak_days, last_active_date, active_title_id, total_wins, total_losses, total_reps, exercise_reps_json) VALUES (?, 0, 1, 1, ?, "novice", 0, 0, 0, "{}")'
    ).run(user.id as string, today);
    progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(session.user_id) as Record<string, unknown>;
  }

  return { user: formattedUser, progress };
}

