import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { getDatabase } from './server/db';
import { 
  hashPassword, 
  verifyPassword, 
  checkRateLimit, 
  recordFailedAttempt, 
  clearFailedAttempts, 
  createSession, 
  getSessionUser 
} from './server/auth';
import { handleWebSocketConnection, clients } from './server/chatVoice';
import { addToQueue, removeFromQueue, handleClientRep, startDuel, handlePlayerDisconnect, createBattleInvite, respondBattleInvite, activeBattles } from './server/battle';
import { listProducts, createOrder, createDonationOrder, createPlayerDonationOrder, verifyOrder, getUserEntitlements } from './server/payments';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.set('trust proxy', 1);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));
app.use(cookieParser());
const uploadsDir = path.resolve(process.cwd(), 'uploads/avatars');
fs.mkdirSync(uploadsDir, { recursive: true });
function isValidAvatar(value: unknown, userId: string): boolean {
  if (typeof value !== 'string' || value.length > 300) return false;
  if (/^[^\/\\.\s]{1,8}$/u.test(value)) return true;
  const escaped=String(userId).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`^/uploads/avatars/${escaped}-\\d+\\.(?:webp|png|jpg)$`).test(value);
}
function removeOwnedAvatar(value: unknown, userId: string) {
  if (!isValidAvatar(value,userId) || typeof value !== 'string' || !value.startsWith('/uploads/avatars/')) return;
  const file=path.basename(value);
  const full=path.join(uploadsDir,file);
  if(!full.startsWith(uploadsDir+path.sep)) return;
  try{fs.unlinkSync(full);}catch{/* already absent */}
}

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), { maxAge: '7d', immutable: true }));

// Initialize Database
const db = getDatabase();
db.prepare("DELETE FROM users WHERE is_guest=1 AND id IN (SELECT u.id FROM users u LEFT JOIN sessions s ON s.user_id=u.id GROUP BY u.id HAVING COALESCE(MAX(s.last_active),u.created_at) < ?)").run(Date.now()-30*24*60*60*1000);

function setSessionCookie(req: Request, res: Response, sessionId: string) {
  const isSecure = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  res.cookie('forgemuscle_session', sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

// WebSocket HTTP Upgrade handler - handles only /ws without interfering with Vite HMR
server.on('upgrade', (req, socket, head) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') {
      if (process.env.NODE_ENV === 'production') socket.destroy();
      return;
    }

    const cookieHeader = req.headers.cookie || '';
    let sessionId: string | null = null;
    const cookiePairs = cookieHeader.split(';').map((c) => c.trim());
    for (const pair of cookiePairs) {
      if (pair.startsWith('forgemuscle_session=')) {
        sessionId = decodeURIComponent(pair.substring('forgemuscle_session='.length));
        break;
      }
    }

    let authUser: { id: string; nick: string; avatar: string; title: string } | null = null;
    if (sessionId) {
      const sessionData = getSessionUser(sessionId);
      if (sessionData && sessionData.user) {
        authUser = {
          id: sessionData.user.id as string,
          nick: sessionData.user.nick as string,
          avatar: (sessionData.user.avatar as string) || '⚡',
          title: (sessionData.progress?.active_title_id as string) || 'Новачок'
        };
      }
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      if (!authUser) { ws.close(1008, 'Authentication required'); return; }
      (ws as any).userId = authUser.id;
      (ws as any).userNick = authUser.nick;
      (ws as any).userAvatar = authUser.avatar;
      (ws as any).userTitle = authUser.title;
      (ws as any).isAuthenticated = true;

      wss.emit('connection', ws, req);
    });
  } catch {
    socket.destroy();
  }
});

// WebSocket connection routing
wss.on('connection', (ws: WebSocket) => {
  handleWebSocketConnection(ws);

});

// Middleware to extract user session
function authenticateSession(req: Request, res: Response, next: () => void) {
  const sessionId = req.cookies?.forgemuscle_session;
  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: No active session' });
  }
  const sessionData = getSessionUser(sessionId);
  if (!sessionData) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
  (req as Request & { user: Record<string, unknown>; progress: Record<string, unknown>; sessionId: string }).user = sessionData.user;
  (req as Request & { user: Record<string, unknown>; progress: Record<string, unknown>; sessionId: string }).progress = sessionData.progress;
  (req as Request & { user: Record<string, unknown>; progress: Record<string, unknown>; sessionId: string }).sessionId = sessionId;
  next();
}


// ─── PLAYER SEARCH ────────────────────────────────────────────────────────────
app.get('/api/players/search', authenticateSession, (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ players: [] });
  const me = String((req as any).user.id);
  const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
  const rows = db.prepare(`SELECT u.id,u.nick,u.avatar,
    CASE WHEN EXISTS(SELECT 1 FROM sessions s WHERE s.user_id=u.id AND s.expires_at>? AND s.last_active>?) THEN 1 ELSE 0 END online
    FROM users u WHERE u.id!=? AND u.nick LIKE ? ESCAPE '\\' ORDER BY online DESC,u.nick COLLATE NOCASE LIMIT 20`)
    .all(Date.now(), Date.now()-90_000, me, like) as any[];
  res.json({players: rows.map(p=>({...p,online:Boolean(p.online)}))});
});

app.post('/api/players/challenge', authenticateSession, (req: Request, res: Response) => {
  const userId=String((req as any).user.id);
  const targetId=String(req.body?.targetUserId||'');
  const exerciseId=String(req.body?.exerciseId||'pushups');
  const durationSeconds=Number(req.body?.durationSeconds)||60;
  if(!targetId || targetId===userId) return res.status(400).json({error:'Invalid opponent'});
  const target=[...clients.values()].find(c=>c.userId===targetId);
  const me=[...clients.values()].find(c=>c.userId===userId);
  if(!target || target.ws.readyState!==WebSocket.OPEN) return res.status(409).json({error:'Гравець зараз офлайн'});
  if(!me || me.ws.readyState!==WebSocket.OPEN) return res.status(409).json({error:'WebSocket не підключений'});
  try {
    const invite=createBattleInvite({userId:me.userId,nick:me.nick,avatar:me.avatar,ws:me.ws},{userId:target.userId,nick:target.nick,avatar:target.avatar,ws:target.ws},exerciseId,durationSeconds);
    res.json({success:true,inviteId:invite.id,expiresAt:invite.expiresAt});
  } catch(err) {
    const code=err instanceof Error?err.message:'challenge_failed';
    res.status(code==='player_busy'?409:429).json({error:code});
  }
});

// ─── PHOTO AVATAR ─────────────────────────────────────────────────────────────
app.post('/api/profile/avatar', authenticateSession, (req: Request, res: Response) => {
  const userId=String((req as any).user.id); const dataUrl=String(req.body?.dataUrl||'');
  const m=dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if(!m) return res.status(400).json({error:'Unsupported image format'});
  const mime=m[1].toLowerCase(), buf=Buffer.from(m[2],'base64');
  if(buf.length>300*1024) return res.status(413).json({error:'Avatar must be <= 300 KB after compression'});
  const magic=(mime==='image/jpeg'&&buf.subarray(0,3).equals(Buffer.from([255,216,255])))||(mime==='image/png'&&buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(mime==='image/webp'&&buf.length>=12&&buf.subarray(0,4).toString()==='RIFF'&&buf.subarray(8,12).toString()==='WEBP'&&buf.readUInt32LE(4)+8<=buf.length);
  if(!magic) return res.status(400).json({error:'Invalid image signature'});
  const ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg', filename=`${userId}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(uploadsDir,filename),buf,{flag:'wx'}); const avatar=`/uploads/avatars/${filename}`;
  const old=db.prepare('SELECT avatar FROM users WHERE id=?').get(userId) as any;
  db.prepare('UPDATE users SET avatar=?,updated_at=? WHERE id=?').run(avatar,Date.now(),userId);
  removeOwnedAvatar(old?.avatar,userId)
  res.json({success:true,avatar});
});
app.delete('/api/profile/avatar', authenticateSession, (req: Request,res: Response)=>{
  const userId=String((req as any).user.id), old=db.prepare('SELECT avatar FROM users WHERE id=?').get(userId) as any;
  removeOwnedAvatar(old?.avatar,userId)
  db.prepare("UPDATE users SET avatar='⚡',updated_at=? WHERE id=?").run(Date.now(),userId); res.json({success:true,avatar:'⚡'});
});

// ─── AUTHENTICATION ROUTES ───────────────────────────────────────────────────

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, nick, avatar, locale, unitSystem } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!email || !password || !nick) {
    return res.status(400).json({ error: 'Заповніть усі обов’язкові поля' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль має містити щонайменше 8 символів' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ error: 'Введіть коректну адресу електронної пошти' });
  if (nick.trim().length < 2) {
    return res.status(400).json({ error: 'Нікнейм має містити щонайменше 2 символи' });
  }
  const requestedAvatar = avatar === undefined ? '⚡' : String(avatar);
  if (!/^[^/\\.\\s]{1,8}$/u.test(requestedAvatar)) return res.status(400).json({ error: 'Invalid avatar' });

  // Check rate limit on registration/login
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({ error: `Забагато спроб. Зачекайте ${Math.ceil((rate.remainingSeconds || 60) / 60)} хв.` });
  }

  // Check unique nick
  const existingNick = db.prepare('SELECT id FROM users WHERE nick = ?').get(nick.trim());
  if (existingNick) {
    return res.status(400).json({ error: 'Цей нікнейм уже зайнятий іншим атлетом' });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existingEmail) {
    return res.status(400).json({ error: 'Користувач із цією поштою вже існує' });
  }

  const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const { hash, salt } = hashPassword(password);
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO users (id, nick, email, avatar, password_hash, password_salt, locale, unit_system, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    nick.trim(),
    email.toLowerCase().trim(),
    requestedAvatar,
    hash,
    salt,
    locale || 'uk',
    unitSystem || 'metric',
    now,
    now
  );

  // Initialize progress
  db.prepare(`
    INSERT INTO progress (user_id, xp, level, streak_days, last_active_date, active_title_id, total_wins, total_losses, total_reps, exercise_reps_json)
    VALUES (?, 0, 1, 1, ?, 'novice', 0, 0, 0, '{}')
  `).run(userId, today);

  // Unlock 'novice' title
  db.prepare('INSERT OR IGNORE INTO user_titles (id, user_id, title_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
    `title_${userId}_novice`,
    userId,
    'novice',
    now
  );

  clearFailedAttempts(ip);
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  const sessionId = createSession(userId, userAgent, ip);

  setSessionCookie(req, res, sessionId);

  const sessionData = getSessionUser(sessionId);
  return res.json({ success: true, ...sessionData });
});

app.post('/api/auth/guest', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const locale = typeof req.body?.locale === 'string' ? req.body.locale.slice(0, 12) : 'uk';
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const guestCount = db.prepare('SELECT COUNT(*) as count FROM guest_creation_limits WHERE ip = ? AND created_at > ?').get(ip, windowStart) as { count: number };
  if ((guestCount?.count || 0) >= 5) {
    return res.status(429).json({ error: 'Забагато гостьових сесій. Спробуйте пізніше.' });
  }

  const userId = `guest_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const nick = `Гість-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`INSERT INTO users (id,nick,email,avatar,locale,unit_system,is_guest,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(userId, nick, null, '⚡', locale, 'metric', 1, now, now);
  db.prepare(`INSERT INTO progress (user_id,xp,level,streak_days,last_active_date,active_title_id,total_wins,total_losses,total_reps,exercise_reps_json) VALUES (?,0,1,1,?, 'novice',0,0,0,'{}')`).run(userId, today);
  db.prepare('INSERT OR IGNORE INTO user_titles (id,user_id,title_id,unlocked_at) VALUES (?,?,?,?)').run(`title_${userId}_novice`, userId, 'novice', now);
  db.prepare('INSERT INTO guest_creation_limits (ip,created_at) VALUES (?,?)').run(ip, now);

  const sessionId = createSession(userId, String(req.headers['user-agent'] || 'Web Browser'), ip);
  setSessionCookie(req, res, sessionId);
  return res.json({ success: true, ...getSessionUser(sessionId) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Введіть email/нікнейм та пароль' });
  }

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({ error: `Забагато невдалих спроб. Зачекайте ${Math.ceil((rate.remainingSeconds || 60) / 60)} хв.` });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? OR nick = ?').get(
    identifier.toLowerCase().trim(),
    identifier.trim()
  ) as Record<string, unknown> | undefined;

  if (!user || !user.password_hash || !user.password_salt) {
    recordFailedAttempt(ip);
    return res.status(400).json({ error: 'Невірний логін або пароль' });
  }

  const isValid = verifyPassword(password, user.password_hash as string, user.password_salt as string);
  if (!isValid) {
    recordFailedAttempt(ip);
    return res.status(400).json({ error: 'Невірний логін або пароль' });
  }

  clearFailedAttempts(ip);
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  const sessionId = createSession(user.id as string, userAgent, ip);

  setSessionCookie(req, res, sessionId);

  const sessionData = getSessionUser(sessionId);
  return res.json({ success: true, ...sessionData });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const sessionId = req.cookies?.forgemuscle_session;
  if (!sessionId) {
    return res.json({ authenticated: false });
  }
  const sessionData = getSessionUser(sessionId);
  if (!sessionData) {
    return res.json({ authenticated: false });
  }
  return res.json({ authenticated: true, ...sessionData });
});

app.post('/api/auth/logout', authenticateSession, (req: Request, res: Response) => {
  const sessionId=(req as any).sessionId; const userId=(req as any).user.id as string; const g=db.prepare('SELECT is_guest FROM users WHERE id=?').get(userId) as {is_guest?:number}|undefined;
  if(g?.is_guest) { db.prepare("UPDATE chat_messages SET user_nick='Видалений користувач', user_avatar='⚡', user_title=NULL WHERE user_id=?").run(userId); db.prepare('DELETE FROM users WHERE id=?').run(userId); } else db.prepare('DELETE FROM sessions WHERE id=?').run(sessionId);
  res.clearCookie('forgemuscle_session'); return res.json({success:true,deletedGuest:Boolean(g?.is_guest)});
});

app.post('/api/auth/logout-all', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  res.clearCookie('forgemuscle_session');
  return res.json({ success: true });
});

app.get('/api/auth/sessions', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const sessions = db.prepare('SELECT id, device_info, ip, last_active, created_at FROM sessions WHERE user_id = ?').all(userId);
  return res.json({ sessions });
});

// Password recovery with developer console mailer
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ error: 'Вкажіть коректний email' });
  }

  const rate = checkRateLimit(`reset:${ip}`);
  if (!rate.allowed) {
    return res.status(429).json({ error: `Забагато запитів. Зачекайте ${Math.ceil((rate.remainingSeconds || 60) / 60)} хв.` });
  }
  recordFailedAttempt(`reset:${ip}`);

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim()) as { id: string; email: string } | undefined;
  if (!user) {
    return res.json({ success: true, message: 'Якщо цей email зареєстровано, інструкцію надіслано.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  db.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at <= ?').run(user.id, Date.now());
  db.prepare('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

  const resetUrl = `${req.protocol}://${req.get('host')}?reset_token=${token}`;
  console.log('──────────────────────────────────────────────────────────────────────────');
  console.log(`[FORGEMUSCLE MAILER DEV MODE] Відновлення пароля для: ${user.email}`);
  console.log(`Посилання для скидання: ${resetUrl}`);
  console.log('──────────────────────────────────────────────────────────────────────────');

  return res.json({
    success: true,
    message: 'Посилання для скидання створено. У режимі розробки дивіться консоль сервера.'
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Недійсний токен або занадто короткий пароль' });
  }

  const reset = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ?').get(
    token,
    Date.now()
  ) as { user_id: string } | undefined;

  if (!reset) {
    return res.status(400).json({ error: 'Посилання застаріло або вже було використане' });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?').run(
    hash,
    salt,
    Date.now(),
    reset.user_id
  );
  db.prepare('UPDATE password_resets SET used = 1 WHERE token = ?').run(token);
  db.prepare('DELETE FROM password_resets WHERE user_id = ? AND used = 1').run(reset.user_id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);

  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  clearFailedAttempts(`reset:${ip}`);

  return res.json({ success: true, message: 'Пароль успішно змінено! Усі попередні сесії завершено. Тепер увійдіть з новим паролем.' });
});

app.post('/api/auth/update-profile', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const { 
    nick, 
    avatar, 
    theme, 
    locale, 
    unitSystem, 
    soundEnabled, 
    hapticEnabled, 
    privacy,
    onboardingCompleted,
    micEnabled,
    cameraEnabled,
    pushToTalk,
    showSkeleton,
    mirrorVideo
  } = req.body;

  if (nick) {
    const trimmed = nick.trim();
    const collision = db.prepare('SELECT id FROM users WHERE nick = ? AND id != ?').get(trimmed, userId);
    if (collision) {
      return res.status(400).json({ error: 'Цей нікнейм уже використовується' });
    }
    db.prepare('UPDATE users SET nick = ? WHERE id = ?').run(trimmed, userId);
  }

  if (avatar !== undefined) { if (!isValidAvatar(avatar,userId)) return res.status(400).json({error:'Invalid avatar'}); db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, userId); }
  if (theme) db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(theme, userId);
  if (locale) db.prepare('UPDATE users SET locale = ? WHERE id = ?').run(locale, userId);
  if (unitSystem) db.prepare('UPDATE users SET unit_system = ? WHERE id = ?').run(unitSystem, userId);
  if (soundEnabled !== undefined) db.prepare('UPDATE users SET sound_enabled = ? WHERE id = ?').run(soundEnabled ? 1 : 0, userId);
  if (hapticEnabled !== undefined) db.prepare('UPDATE users SET haptic_enabled = ? WHERE id = ?').run(hapticEnabled ? 1 : 0, userId);
  if (privacy) db.prepare('UPDATE users SET privacy = ? WHERE id = ?').run(privacy, userId);
  if (onboardingCompleted !== undefined) db.prepare('UPDATE users SET onboarding_completed = ? WHERE id = ?').run(onboardingCompleted ? 1 : 0, userId);
  if (micEnabled !== undefined) db.prepare('UPDATE users SET mic_enabled = ? WHERE id = ?').run(micEnabled ? 1 : 0, userId);
  if (cameraEnabled !== undefined) db.prepare('UPDATE users SET camera_enabled = ? WHERE id = ?').run(cameraEnabled ? 1 : 0, userId);
  if (pushToTalk !== undefined) db.prepare('UPDATE users SET push_to_talk = ? WHERE id = ?').run(pushToTalk ? 1 : 0, userId);
  if (showSkeleton !== undefined) db.prepare('UPDATE users SET show_skeleton = ? WHERE id = ?').run(showSkeleton ? 1 : 0, userId);
  if (mirrorVideo !== undefined) db.prepare('UPDATE users SET mirror_video = ? WHERE id = ?').run(mirrorVideo ? 1 : 0, userId);

  db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(Date.now(), userId);
  const sessionId = (req as Request & { sessionId?: string }).sessionId;
  const sessionData = sessionId ? getSessionUser(sessionId) : null;
  return res.json({ success: true, user: sessionData ? sessionData.user : undefined });
});

// Change Password for email-authenticated accounts
app.post('/api/auth/change-password', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Новий пароль має містити щонайменше 8 символів' });
  }

  const user = db.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?').get(userId) as {
    password_hash: string | null;
    password_salt: string | null;
  } | undefined;

  if (!user || !user.password_hash || !user.password_salt) {
    return res.status(400).json({ error: 'Для цього акаунта не встановлено пароль. Зміна пароля недоступна.' });
  }

  if (!verifyPassword(currentPassword || '', user.password_hash, user.password_salt)) {
    return res.status(400).json({ error: 'Невірний поточний пароль' });
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?').run(
    hash,
    salt,
    Date.now(),
    userId
  );

  return res.json({ success: true, message: 'Пароль успішно змінено' });
});

// Onboarding endpoints
app.post('/api/onboarding/complete', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  db.prepare('UPDATE users SET onboarding_completed = 1, updated_at = ? WHERE id = ?').run(Date.now(), userId);
  return res.json({ success: true, onboardingCompleted: true });
});

app.post('/api/onboarding/reset', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  db.prepare('UPDATE users SET onboarding_completed = 0, updated_at = ? WHERE id = ?').run(Date.now(), userId);
  return res.json({ success: true, onboardingCompleted: false });
});

// Export all user data (GDPR / athlete privacy)
app.get('/api/user/export', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const user = db.prepare('SELECT id, nick, email, avatar, locale, unit_system, theme, sound_enabled, haptic_enabled, privacy, onboarding_completed, created_at, updated_at FROM users WHERE id = ?').get(userId);
  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId);
  const titles = db.prepare('SELECT * FROM user_titles WHERE user_id = ?').all(userId);
  const quests = db.prepare('SELECT * FROM user_quests WHERE user_id = ?').all(userId);
  const matches = db.prepare('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?').all(userId, userId);

  const exportPayload = {
    app: 'ForgeMuscle',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    profile: user,
    progress,
    titles,
    quests,
    matchHistory: matches
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="forgemuscle-data-${userId}.json"`);
  return res.json(exportPayload);
});

// Wipe user workout history & progress (keep account)
app.post('/api/user/delete-data', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const today = new Date().toISOString().split('T')[0];

  db.prepare('UPDATE progress SET xp = 0, level = 1, streak_days = 1, total_wins = 0, total_losses = 0, total_reps = 0, exercise_reps_json = "{}", last_active_date = ? WHERE user_id = ?').run(today, userId);
  db.prepare('DELETE FROM user_quests WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM user_titles WHERE user_id = ? AND title_id != "novice"').run(userId);

  return res.json({ success: true, message: 'Дані тренувань та прогрес очищено' });
});

// Report chat message
app.post('/api/chat/report', authenticateSession, (req: Request, res: Response) => {
  const reporterId = (req as Request & { user: { id: string } }).user.id;
  const { messageId, reportedUserId, reason } = req.body;
  console.log(`[FORGEMUSCLE MODERATION] Скарга від ${reporterId} на користувача ${reportedUserId}, msg: ${messageId}, причина: ${reason || 'неприйнятний контент'}`);
  return res.json({ success: true, message: 'Скаргу надіслано модераторам' });
});

app.delete('/api/auth/account', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.clearCookie('forgemuscle_session');
  return res.json({ success: true });
});

// ─── SHOP & INVENTORY ────────────────────────────────────────────────────────

app.get('/api/shop/items', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const items = db.prepare('SELECT * FROM shop_items ORDER BY price ASC').all() as Record<string, unknown>[];
  const userItems = db.prepare('SELECT item_id, equipped FROM user_items WHERE user_id = ?').all(userId) as { item_id: string; equipped: number }[];
  const ownedMap = new Map(userItems.map((ui) => [ui.item_id, ui.equipped]));

  const enriched = items.map((item) => ({
    ...item,
    owned: ownedMap.has(item.id as string),
    equipped: ownedMap.get(item.id as string) === 1
  }));

  const progress = db.prepare('SELECT coins, xp, level FROM progress WHERE user_id = ?').get(userId);
  return res.json({ items: enriched, progress });
});

app.post('/api/shop/purchase', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'Вкажіть ID товару' });
  }

  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId) as Record<string, unknown> | undefined;
  if (!item) {
    return res.status(404).json({ error: 'Товар не знайдено' });
  }

  const alreadyOwned = db.prepare('SELECT id FROM user_items WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (alreadyOwned) {
    return res.status(400).json({ error: 'Цей предмет уже є у вашому інвентарі' });
  }

  const progress = db.prepare('SELECT coins, xp, level FROM progress WHERE user_id = ?').get(userId) as { coins: number; xp: number; level: number } | undefined;
  const currentCoins = progress ? progress.coins : 0;
  const price = item.price as number;

  if (currentCoins < price) {
    return res.status(400).json({ error: `Недостатньо Forge Coins. Потрібно: ${price} 🪙, у вас: ${currentCoins} 🪙` });
  }

  const now = Date.now();
  const newBalance = currentCoins - price;

  // Atomic transaction
  db.prepare('UPDATE progress SET coins = ? WHERE user_id = ?').run(newBalance, userId);
  db.prepare('INSERT INTO user_items (id, user_id, item_id, purchased_at, equipped) VALUES (?, ?, ?, ?, 0)').run(
    `uitem_${now}_${crypto.randomBytes(3).toString('hex')}`,
    userId,
    itemId,
    now
  );
  db.prepare('INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    `tx_${now}`,
    userId,
    'purchase',
    -price,
    newBalance,
    itemId,
    `Купівля товару: ${item.name}`,
    now
  );

  const newAchievements = checkAndGrantAchievements(userId);

  return res.json({
    success: true,
    coins: newBalance,
    purchasedItem: item,
    newAchievements
  });
});

app.post('/api/shop/equip', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const { itemId } = req.body;

  const userItem = db.prepare('SELECT ui.*, si.category, si.icon, si.effect_value FROM user_items ui JOIN shop_items si ON ui.item_id = si.id WHERE ui.user_id = ? AND ui.item_id = ?').get(userId, itemId) as { category: string; icon: string; effect_value: string } | undefined;

  if (!userItem) {
    return res.status(400).json({ error: 'Предмет не знайдено у вашому інвентарі' });
  }

  // Toggle or equip
  if (userItem.category === 'avatar') {
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(userItem.icon, userId);
  } else if (userItem.category === 'theme') {
    db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(userItem.effect_value || 'dark', userId);
  }

  db.prepare('UPDATE user_items SET equipped = CASE WHEN item_id = ? THEN 1 ELSE 0 END WHERE user_id = ? AND item_id IN (SELECT id FROM shop_items WHERE category = ?)').run(
    itemId,
    userId,
    userItem.category
  );

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return res.json({ success: true, user: updatedUser });
});

// ─── ACHIEVEMENTS SYSTEM ─────────────────────────────────────────────────────

function checkAndGrantAchievements(userId: string): Record<string, unknown>[] {
  const newlyUnlocked: Record<string, unknown>[] = [];
  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!progress) return newlyUnlocked;

  const totalWins = (progress.total_wins as number) || 0;
  const totalLosses = (progress.total_losses as number) || 0;
  const totalBattles = totalWins + totalLosses;
  const totalReps = (progress.total_reps as number) || 0;

  const itemsCount = (db.prepare('SELECT COUNT(*) as cnt FROM user_items WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const chatCount = (db.prepare('SELECT COUNT(*) as cnt FROM chat_messages WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const competitionCount = (db.prepare('SELECT COUNT(*) as cnt FROM competition_entries WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const competitionWins = (db.prepare("SELECT COUNT(*) as cnt FROM competition_entries e WHERE e.user_id=? AND e.score >= (SELECT COALESCE(MAX(e2.score),0) FROM competition_entries e2 WHERE e2.competition_id=e.competition_id)").get(userId) as { cnt: number }).cnt || 0;
  const allAchievements = db.prepare('SELECT * FROM achievements').all() as Record<string, unknown>[];
  const userUnlocked = new Set((db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId) as { achievement_id: string }[]).map((u) => u.achievement_id));

  const now = Date.now();

  for (const ach of allAchievements) {
    const achId = ach.id as string;
    if (userUnlocked.has(achId)) continue;

    let isEligible = false;
    const condType = ach.condition_type as string;
    const condVal = ach.condition_value as number;

    if (condType === 'battles_count' && totalBattles >= condVal) isEligible = true;
    if (condType === 'wins_count' && totalWins >= condVal) isEligible = true;
    if (condType === 'total_reps' && totalReps >= condVal) isEligible = true;
    if (condType === 'items_owned' && itemsCount >= condVal) isEligible = true;
    if (condType === 'chat_messages' && chatCount >= condVal) isEligible = true;
    if (condType === 'competition_entries' && competitionCount >= condVal) isEligible = true;
    if (condType === 'competition_wins' && competitionWins >= condVal) isEligible = true;
    if (condType === 'perfect_accuracy' && totalWins >= 1) isEligible = true;

    if (isEligible) {
      db.prepare('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at, reward_claimed) VALUES (?, ?, ?, ?, 1)').run(
        `uach_${now}_${achId}`,
        userId,
        achId,
        now
      );

      // Award XP and Coins
      const xpReward = (ach.xp_reward as number) || 0;
      const coinsReward = (ach.coins_reward as number) || 0;

      const currXp = (progress.xp as number) || 0;
      const currCoins = (progress.coins as number) || 0;
      const updatedXp = currXp + xpReward;
      const updatedCoins = currCoins + coinsReward;
      const newLvl = Math.max((progress.level as number) || 1, Math.floor(Math.pow(updatedXp / 100, 1 / 1.35)) + 1);

      db.prepare('UPDATE progress SET xp = ?, coins = ?, level = ? WHERE user_id = ?').run(
        updatedXp,
        updatedCoins,
        newLvl,
        userId
      );

      db.prepare('INSERT INTO transactions (id, user_id, type, amount, balance_after, reference_id, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        `tx_${now}_ach_${achId}`,
        userId,
        'reward',
        coinsReward,
        updatedCoins,
        achId,
        `Нагорода за досягнення: ${ach.title}`,
        now
      );

      newlyUnlocked.push({ ...ach, unlocked_at: now });
      userUnlocked.add(achId);
    }
  }

  return newlyUnlocked;
}

app.get('/api/achievements', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY xp_reward ASC').all() as Record<string, unknown>[];
  const userUnlocked = db.prepare('SELECT achievement_id, unlocked_at, reward_claimed FROM user_achievements WHERE user_id = ?').all(userId) as { achievement_id: string; unlocked_at: number; reward_claimed: number }[];
  const unlockedMap = new Map(userUnlocked.map((u) => [u.achievement_id, u]));

  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  const totalBattles = progress ? ((progress.total_wins as number) || 0) + ((progress.total_losses as number) || 0) : 0;
  const totalWins = progress ? (progress.total_wins as number) || 0 : 0;
  const totalReps = progress ? (progress.total_reps as number) || 0 : 0;
  const itemsCount = (db.prepare('SELECT COUNT(*) as cnt FROM user_items WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const chatCount = (db.prepare('SELECT COUNT(*) as cnt FROM chat_messages WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const competitionCount = (db.prepare('SELECT COUNT(*) as cnt FROM competition_entries WHERE user_id = ?').get(userId) as { cnt: number }).cnt || 0;
  const competitionWins = (db.prepare("SELECT COUNT(*) as cnt FROM competition_entries e WHERE e.user_id=? AND e.score >= (SELECT COALESCE(MAX(e2.score),0) FROM competition_entries e2 WHERE e2.competition_id=e.competition_id)").get(userId) as { cnt: number }).cnt || 0;

  const enriched = allAchievements.map((ach) => {
    const un = unlockedMap.get(ach.id as string);
    const condType = ach.condition_type as string;
    let currentVal = 0;
    if (condType === 'battles_count') currentVal = totalBattles;
    if (condType === 'wins_count') currentVal = totalWins;
    if (condType === 'total_reps') currentVal = totalReps;
    if (condType === 'items_owned') currentVal = itemsCount;
    if (condType === 'chat_messages') currentVal = chatCount;
    if (condType === 'competition_entries') currentVal = competitionCount;
    if (condType === 'competition_wins') currentVal = competitionWins;
    if (condType === 'perfect_accuracy') currentVal = totalWins >= 1 ? 1 : 0;

    return {
      ...ach,
      unlocked: !!un,
      unlocked_at: un ? un.unlocked_at : null,
      reward_claimed: un ? un.reward_claimed === 1 : false,
      currentValue: Math.min((ach.condition_value as number), currentVal),
      targetValue: ach.condition_value
    };
  });

  return res.json({ achievements: enriched });
});

app.post('/api/achievements/check', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const newlyUnlocked = checkAndGrantAchievements(userId);
  return res.json({ success: true, newlyUnlocked });
});


// ─── COMPETITIONS ─────────────────────────────────────────────────────────────
const COMPETITION_EXERCISES = ['pushups','squats','pullups','jumping_jacks','burpees','lunges','dips','plank'];
function competitionTitle(exerciseId: string) { return `Змагання: ${exerciseId}`; }
function syncCompetitions() {
  const now = Date.now();
  const active = db.prepare("SELECT id FROM competitions WHERE status='active' AND ends_at <= ?").all(now) as {id:string}[];
  for (const row of active) finalizeCompetition(row.id);
  const day = new Date(now); day.setHours(0,0,0,0); const dayStart=day.getTime();
  for (const exerciseId of COMPETITION_EXERCISES) {
    const id=`daily_${new Date(dayStart).toISOString().slice(0,10)}_${exerciseId}`;
    if (!db.prepare('SELECT id FROM competitions WHERE id=?').get(id)) db.prepare('INSERT INTO competitions (id,exercise_id,title,starts_at,ends_at,status,prize_xp,prize_coins,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(id,exerciseId,competitionTitle(exerciseId),dayStart,dayStart+24*60*60*1000,'active',100,100,now);
  }
  const weekStart = new Date(now); const monday=(weekStart.getDay()+6)%7; weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate()-monday); const ws=weekStart.getTime();
  const wid=`weekly_${new Date(ws).toISOString().slice(0,10)}`;
  if (!db.prepare('SELECT id FROM competitions WHERE id=?').get(wid)) db.prepare('INSERT INTO competitions (id,exercise_id,title,starts_at,ends_at,status,prize_xp,prize_coins,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(wid,'pushups','Велике тижневе змагання',ws,ws+7*24*60*60*1000,'active',500,500,now);
}
function finalizeCompetition(id:string) {
  const comp=db.prepare("SELECT * FROM competitions WHERE id=? AND status='active'").get(id) as any; if(!comp) return;
  db.prepare("UPDATE competitions SET status='finished' WHERE id=?").run(id);
  const top=db.prepare('SELECT * FROM competition_entries WHERE competition_id=? ORDER BY score DESC, reps DESC, duration_sec ASC LIMIT 3').all(id) as any[];
  top.forEach((entry,i)=>{
    const xp=Math.max(0,Number(comp.prize_xp)||100)*(i===0?1:i===1?.6:.4); const coins=Math.max(0,Number(comp.prize_coins)||100)*(i===0?1:i===1?.6:.4);
    const progress=db.prepare('SELECT coins,xp FROM progress WHERE user_id=?').get(entry.user_id) as any; if(!progress) return;
    const newCoins=(progress.coins||0)+Math.round(coins), newXp=(progress.xp||0)+Math.round(xp);
    db.prepare('UPDATE progress SET coins=?,xp=? WHERE user_id=?').run(newCoins,newXp,entry.user_id);
    db.prepare('INSERT INTO transactions (id,user_id,type,amount,balance_after,reference_id,description,created_at) VALUES (?,?,?,?,?,?,?,?)').run(`tx_comp_${id}_${entry.user_id}`,entry.user_id,'competition_reward',Math.round(coins),newCoins,id,`Competition place ${i+1}`,Date.now());
    if(i===0) db.prepare('INSERT OR IGNORE INTO user_achievements (id,user_id,achievement_id,unlocked_at) VALUES (?,?,?,?)').run(`ach_${entry.user_id}_competition_winner_${id}`,entry.user_id,'competition_winner',Date.now());
  });
}

syncCompetitions();
setInterval(syncCompetitions, 60_000);


// ─── SOLANA PAYMENTS (separate from wallet identity) ─────────────────────────
app.get('/api/payments/products', authenticateSession, (_req:Request,res:Response)=>res.json({products:listProducts(),network:process.env.SOLANA_CLUSTER||'devnet'}));
app.post('/api/payments/orders', authenticateSession, (req:Request,res:Response)=>{try{const productId=String(req.body?.productId||'');const currency=String(req.body?.currency||'') as 'SOL'|'USDC';if(currency!=='SOL'&&currency!=='USDC')return res.status(400).json({error:'Unsupported currency'});return res.status(201).json({order:createOrder((req as any).user.id,productId,currency)});}catch(e){const msg=e instanceof Error?e.message:'order_failed';return res.status(400).json({error:msg});}});
app.post('/api/payments/donations', authenticateSession, (req:Request,res:Response)=>{try{const currency=String(req.body?.currency||'') as 'SOL'|'USDC';const amount=Number(req.body?.amount);if(currency!=='SOL'&&currency!=='USDC')return res.status(400).json({error:'Unsupported currency'});return res.status(201).json({order:createDonationOrder((req as any).user.id,currency,amount)});}catch(e){const msg=e instanceof Error?e.message:'donation_order_failed';return res.status(400).json({error:msg});}});
app.get('/api/payments/config', (_req:Request,res:Response)=>res.json({solana:{configured:Boolean(process.env.SOLANA_MERCHANT_WALLET),cluster:process.env.SOLANA_CLUSTER||'devnet'}}));
app.post('/api/payments/player-donations', authenticateSession, (req:Request,res:Response)=>{try{const donorId=(req as any).user.id as string;const targetUserId=String(req.body?.targetUserId||'');const battleId=String(req.body?.battleId||'');const currency=String(req.body?.currency||'') as 'SOL'|'USDC';const amount=Number(req.body?.amount);if(currency!=='SOL'&&currency!=='USDC')return res.status(400).json({error:'Unsupported currency'});const battle=activeBattles.get(battleId);if(!battle||battle.status!=='in_progress')return res.status(400).json({error:'battle_not_active'});const isParticipant=battle.player1.userId===targetUserId||battle.player2.userId===targetUserId;if(!isParticipant)return res.status(400).json({error:'target_not_battle_player'});return res.status(201).json({order:createPlayerDonationOrder(donorId,targetUserId,currency,amount,battleId)});}catch(e){const msg=e instanceof Error?e.message:'player_donation_order_failed';return res.status(400).json({error:msg});}});
app.post('/api/payments/orders/:id/verify', authenticateSession, async (req:Request,res:Response)=>{try{const orderId=req.params.id;const userId=(req as any).user.id as string;const row=db.prepare('SELECT user_id FROM payment_orders WHERE id=?').get(orderId) as any;if(!row||row.user_id!==userId)return res.status(404).json({error:'Order not found'});const result=await verifyOrder(orderId,String(req.body?.signature||''));return res.json(result);}catch(e){const msg=e instanceof Error?e.message:'payment_verification_failed';const status=msg==='order_expired'?410:msg==='order_not_found'?404:400;return res.status(status).json({error:msg});}});
app.get('/api/payments/orders/:id',authenticateSession,(req:Request,res:Response)=>{const row=db.prepare('SELECT id,product_id,amount,currency,token_mint,recipient,reference,status,transaction_signature,created_at,expires_at,paid_at FROM payment_orders WHERE id=? AND user_id=?').get(req.params.id,(req as any).user.id) as any;if(!row)return res.status(404).json({error:'Order not found'});res.json({order:row});});
app.get('/api/entitlements',authenticateSession,(req:Request,res:Response)=>res.json({entitlements:getUserEntitlements((req as any).user.id)}));

// ─── SOLANA WALLET LINKING (identity only; no transfers) ─────────────────────
app.post('/api/solana/challenge', authenticateSession, (req: Request,res: Response)=>{
  const userId=(req as any).user.id as string; const address=String(req.body?.address||'').trim(); if(!address) return res.status(400).json({error:'Wallet address required'});
  const nonce=crypto.randomBytes(24).toString('hex'); const expires=Date.now()+5*60*1000; const domain=req.get('host')||'forgemuscle'; const message=`ForgeMuscle wallet verification\nDomain: ${domain}\nWallet: ${address}\nNonce: ${nonce}\nIssued: ${new Date().toISOString()}`;
  db.prepare('INSERT INTO solana_challenges (nonce,user_id,message,expires_at,used) VALUES (?,?,?,?,0)').run(nonce,userId,message,expires); return res.json({nonce,message,expiresAt:expires});
});
app.post('/api/solana/link', authenticateSession, async (req: Request,res: Response)=>{
  try { const {nonce,address,signature}=req.body; const userId=(req as any).user.id as string; const ch=db.prepare('SELECT * FROM solana_challenges WHERE nonce=? AND user_id=? AND used=0 AND expires_at>?').get(nonce,userId,Date.now()) as any; if(!ch) return res.status(400).json({error:'Challenge expired or invalid'});
    const bs58=await import('bs58'); const nacl=await import('tweetnacl'); const web3=await import('@solana/web3.js'); const publicKey=new web3.PublicKey(address); const sig=bs58.default.decode(signature); const messageBytes=new TextEncoder().encode(ch.message); if(sig.length!==64 || !nacl.default.sign.detached.verify(messageBytes,sig,publicKey.toBytes())) return res.status(401).json({error:'Invalid wallet signature'});
    const existing=db.prepare('SELECT user_id FROM wallets WHERE address=?').get(address) as any; if(existing && existing.user_id!==userId) return res.status(409).json({error:'Wallet is already linked'}); db.prepare('INSERT INTO wallets(user_id,address,linked_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET address=excluded.address,linked_at=excluded.linked_at').run(userId,address,Date.now()); db.prepare('UPDATE solana_challenges SET used=1 WHERE nonce=?').run(nonce); return res.json({success:true,address});
  } catch { return res.status(400).json({error:'Invalid Solana wallet data'}); }
});
app.post('/api/solana/unlink', authenticateSession, (req: Request,res: Response)=>{ db.prepare('DELETE FROM wallets WHERE user_id=?').run((req as any).user.id); return res.json({success:true}); });
app.get('/api/solana/wallet', authenticateSession, async (req: Request,res: Response)=>{ const wallet=db.prepare('SELECT address,linked_at FROM wallets WHERE user_id=?').get((req as any).user.id) as any; if(!wallet) return res.json({wallet:null}); try { const web3=await import('@solana/web3.js'); const cluster=(process.env.SOLANA_CLUSTER||'devnet') as any; const endpoint=process.env.SOLANA_RPC_URL || web3.clusterApiUrl(cluster); const connection=new web3.Connection(endpoint); const balance=await connection.getBalance(new web3.PublicKey(wallet.address)); return res.json({wallet:{...wallet,balanceSol:balance/web3.LAMPORTS_PER_SOL,network:cluster}}); } catch { return res.status(502).json({error:'Solana RPC unavailable'}); } });

app.get('/api/competitions', authenticateSession, (req: Request,res: Response)=>{
  syncCompetitions(); const userId=(req as any).user.id as string; const rows=db.prepare(`SELECT c.*, COALESCE((SELECT COUNT(*) FROM competition_entries e WHERE e.competition_id=c.id),0) participants, (SELECT score FROM competition_entries e WHERE e.competition_id=c.id AND e.user_id=?) my_score FROM competitions c WHERE c.ends_at>? ORDER BY c.starts_at ASC LIMIT 50`).all(userId,Date.now()) as any[];
  return res.json({competitions:rows});
});
app.post('/api/competitions/:id/start', authenticateSession, (req: Request,res: Response)=>{
  const userId=(req as any).user.id as string; const id=req.params.id; const comp=db.prepare("SELECT * FROM competitions WHERE id=? AND status='active' AND starts_at<=? AND ends_at>? ").get(id,Date.now(),Date.now()) as any;
  if(!comp) return res.status(404).json({error:'Competition is not active'});
  const nonce=crypto.randomBytes(24).toString('hex'); const started=Date.now(); const expires=Math.min(started+60_000,Number(comp.ends_at));
  db.prepare('DELETE FROM competition_attempts WHERE user_id=? AND competition_id=?').run(userId,id);
  db.prepare('INSERT INTO competition_attempts (nonce,competition_id,user_id,started_at,expires_at,reps,accuracy_sum,last_rep_at,used) VALUES (?,?,?,?,?,0,0,0,0)').run(nonce,id,userId,started,expires);
  return res.json({nonce,startedAt:started,expiresAt:expires,durationSec:Math.ceil((expires-started)/1000)});
});
app.post('/api/competitions/:id/rep', authenticateSession, (req: Request,res: Response)=>{
  const userId=(req as any).user.id as string; const id=req.params.id; const {nonce,accuracy}=req.body; const a=db.prepare('SELECT * FROM competition_attempts WHERE nonce=? AND competition_id=? AND user_id=? AND used=0').get(nonce,id,userId) as any;
  if(!a || Date.now()>a.expires_at) return res.status(400).json({error:'Attempt expired or invalid'});
  const now=Date.now(); if(a.last_rep_at && now-a.last_rep_at<250) return res.status(429).json({error:'Repetition rate too high'});
  const acc=Math.max(0,Math.min(100,Number(accuracy)||0)); db.prepare('UPDATE competition_attempts SET reps=reps+1,accuracy_sum=accuracy_sum+?,last_rep_at=? WHERE nonce=?').run(acc,now,nonce);
  return res.json({accepted:true,reps:Number(a.reps)+1});
});
app.post('/api/competitions/:id/finish', authenticateSession, (req: Request,res: Response)=>{
  const userId=(req as any).user.id as string; const id=req.params.id; const {nonce}=req.body; const a=db.prepare('SELECT * FROM competition_attempts WHERE nonce=? AND competition_id=? AND user_id=? AND used=0').get(nonce,id,userId) as any;
  if(!a) return res.status(400).json({error:'Invalid attempt'}); const comp=db.prepare('SELECT * FROM competitions WHERE id=?').get(id) as any; const duration=Math.min(60,Math.max(1,Math.ceil((Math.min(Date.now(),a.expires_at)-a.started_at)/1000))); const accuracy=a.reps? a.accuracy_sum/a.reps:0; const score=a.reps*(accuracy/100);
  const old=db.prepare('SELECT score FROM competition_entries WHERE competition_id=? AND user_id=?').get(id,userId) as any;
  if(!old || score>old.score) db.prepare(`INSERT INTO competition_entries (id,competition_id,user_id,reps,accuracy,score,duration_sec,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(competition_id,user_id) DO UPDATE SET reps=excluded.reps,accuracy=excluded.accuracy,score=excluded.score,duration_sec=excluded.duration_sec,created_at=excluded.created_at`).run(`entry_${id}_${userId}`,id,userId,a.reps,accuracy,score,duration,Date.now());
  db.prepare('UPDATE competition_attempts SET used=1 WHERE nonce=?').run(nonce); db.prepare('INSERT OR IGNORE INTO user_achievements (id,user_id,achievement_id,unlocked_at) VALUES (?,?,?,?)').run(`ach_${userId}_competition_participant_${id}`,userId,'competition_participant',Date.now());
  const rank=(db.prepare('SELECT COUNT(*)+1 rank FROM competition_entries WHERE competition_id=? AND score>?').get(id,score) as any).rank; return res.json({score,reps:a.reps,accuracy,durationSec:duration,rank,finished:Date.now()>=comp.ends_at});
});
app.get('/api/competitions/:id/leaderboard', authenticateSession, (req: Request,res: Response)=>{ const userId=(req as any).user.id as string; const id=req.params.id; const top=db.prepare(`SELECT e.*,u.nick,u.avatar FROM competition_entries e JOIN users u ON u.id=e.user_id WHERE e.competition_id=? ORDER BY e.score DESC,e.reps DESC,e.duration_sec ASC LIMIT 50`).all(id) as any[]; const mine=db.prepare('SELECT * FROM competition_entries WHERE competition_id=? AND user_id=?').get(id,userId) as any; const rank=mine?(db.prepare('SELECT COUNT(*)+1 rank FROM competition_entries WHERE competition_id=? AND score>?').get(id,mine.score) as any).rank:null; return res.json({entries:top,me:mine?{...mine,rank}:null}); });

app.post('/api/progress/learning', authenticateSession, (req: Request, res: Response) => {
  const userId = (req as Request & { user: { id: string } }).user.id;
  const { itemType, itemId, payload } = req.body;
  const now = Date.now();

  db.prepare(`
    INSERT INTO learning_progress (id, user_id, item_type, item_id, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, item_type, item_id) DO UPDATE SET payload_json = excluded.payload_json
  `).run(`lrn_${now}`, userId, itemType, itemId, JSON.stringify(payload || {}), now);

  return res.json({ success: true });
});

app.get('/api/chat/history', (req: Request, res: Response) => {
  const roomId = (req.query.roomId as string) || 'global';
  const messages = db.prepare(`
    SELECT id, room_id as roomId, user_id as userId, user_nick as userNick, user_avatar as userAvatar, user_title as userTitle, text, created_at as ts
    FROM chat_messages
    WHERE room_id = ?
    ORDER BY created_at DESC
    LIMIT 60
  `).all(roomId);
  return res.json({ messages: messages.reverse() });
});

app.get('/api/voice/ice-config', authenticateSession, (_req: Request,res: Response)=>res.json({iceServers:[{urls:process.env.STUN_SERVER||'stun:stun.l.google.com:19302'},...(process.env.TURN_SERVER?[{urls:process.env.TURN_SERVER,username:process.env.TURN_USERNAME||'',credential:process.env.TURN_CREDENTIAL||''}]:[])]}));

app.get('/api/voice/rooms', (_req: Request, res: Response) => {
  const rooms = db.prepare('SELECT id, name, max_users as maxUsers FROM voice_rooms').all();
  return res.json({ rooms });
});

// ─── VITE INTEGRATION ────────────────────────────────────────────────────────

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ForgeMuscle] Full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
