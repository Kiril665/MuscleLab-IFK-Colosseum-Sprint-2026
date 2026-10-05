import crypto from 'node:crypto';
import { WebSocket } from 'ws';
import { getDatabase } from './db';
import { EXERCISE_RULES } from '../src/services/exerciseRules';

export interface BattleSession {
  id: string;
  exerciseId: string;
  durationSeconds: number;
  player1: {
    userId: string;
    nick: string;
    avatar: string;
    reps: number;
    accuracy: number;
    lastRepTs: number;
    ws?: WebSocket;
    disconnectedAt?: number;
  };
  player2: {
    userId: string;
    nick: string;
    avatar: string;
    isBot: boolean;
    reps: number;
    accuracy: number;
    lastRepTs: number;
    ws?: WebSocket;
    disconnectedAt?: number;
  };
  remainingSeconds: number;
  nonce: string;
  status: 'countdown' | 'in_progress' | 'finished';
  timer?: NodeJS.Timeout;
  botInterval?: NodeJS.Timeout;
  processedNonces: Set<string>;
}

export interface BattleInvite {
  id:string; from:string; to:string; exerciseId:string; durationSeconds:number; expiresAt:number; status:'pending'|'accepted'|'declined'|'expired';
}
export const battleInvites = new Map<string,BattleInvite>();

export function createBattleInvite(from:{userId:string;nick:string;avatar:string;ws:WebSocket}, to:{userId:string;nick:string;avatar:string;ws:WebSocket}, exerciseId:string, durationSeconds:number = 60) {
  const active=[...battleInvites.values()].find(i=>i.status==='pending' && i.expiresAt>Date.now() && i.from===from.userId);
  if(active) throw new Error('invite_already_pending');
  if([...activeBattles.values()].some(m=>m.status!=='finished' && (m.player1.userId===from.userId||m.player2.userId===from.userId||m.player1.userId===to.userId||m.player2.userId===to.userId))) throw new Error('player_busy');
  if([...matchmakingQueues.values()].some(q=>q.some(p=>p.userId===from.userId||p.userId===to.userId))) throw new Error('player_busy');
  const duration = normalizeDuration(durationSeconds);
  const id=`invite_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const invite:BattleInvite={id,from:from.userId,to:to.userId,exerciseId,durationSeconds:duration,expiresAt:Date.now()+30000,status:'pending'};
  battleInvites.set(id,invite);
  to.ws.send(JSON.stringify({type:'battle_invite',inviteId:id,from:{userId:from.userId,nick:from.nick,avatar:from.avatar},exerciseId,durationSeconds:duration,expiresAt:invite.expiresAt}));
  setTimeout(()=>{const i=battleInvites.get(id);if(i?.status==='pending'){i.status='expired';try{from.ws.send(JSON.stringify({type:'battle_invite_expired',inviteId:id}));}catch{}}},30050);
  return invite;
}
export function respondBattleInvite(inviteId:string,userId:string,accept:boolean, connections:Map<any,{userId:string;nick:string;avatar:string;ws:WebSocket}>) {
  const invite=battleInvites.get(inviteId);
  if(!invite||invite.to!==userId||invite.status!=='pending'||invite.expiresAt<Date.now()) return false;
  invite.status=accept?'accepted':'declined';
  const from=[...connections.values()].find(c=>c.userId===invite.from), to=[...connections.values()].find(c=>c.userId===invite.to);
  if(accept&&from&&to){
    startDuel(invite.exerciseId,{userId:from.userId,nick:from.nick,avatar:from.avatar,ws:from.ws},{userId:to.userId,nick:to.nick,avatar:to.avatar,isBot:false,ws:to.ws}, invite.durationSeconds);
  } else if(from?.ws.readyState===WebSocket.OPEN) {
    from.ws.send(JSON.stringify({type:'battle_invite_response',inviteId,accepted:false}));
  }
  return true;
}

export const activeBattles = new Map<string, BattleSession>();
export const matchmakingQueues = new Map<string, { userId: string; nick: string; avatar: string; ws: WebSocket; joinedAt: number; durationSeconds: number }[]>();

export function normalizeDuration(value: number): number {
  const allowed = [30, 60, 90, 120];
  const n = Number(value);
  return allowed.includes(n) ? n : 60;
}

export function addToQueue(exerciseId: string, player: { userId: string; nick: string; avatar: string; ws: WebSocket; durationSeconds?: number }) {
  const durationSeconds = normalizeDuration(player.durationSeconds ?? 60);
  const queueKey = `${exerciseId}:${durationSeconds}`;
  let queue = matchmakingQueues.get(queueKey);
  if (!queue) {
    queue = [];
    matchmakingQueues.set(queueKey, queue);
  }
  // Remove existing entry for same user
  const idx = queue.findIndex((p) => p.userId === player.userId);
  if (idx !== -1) queue.splice(idx, 1);

  // Check if we can pair with an waiting opponent (who is not the same user)
  const opponentIdx = queue.findIndex((p) => p.userId !== player.userId);
  if (opponentIdx !== -1) {
    const opponent = queue.splice(opponentIdx, 1)[0];
    broadcastQueueUpdate(queueKey);
    startDuel(exerciseId, player, {
      userId: opponent.userId,
      nick: opponent.nick,
      avatar: opponent.avatar,
      isBot: false,
      ws: opponent.ws
    }, durationSeconds);
  } else {
    queue.push({ ...player, durationSeconds, joinedAt: Date.now() });
    broadcastQueueUpdate(queueKey);
  }
}

export function removeFromQueue(userId: string) {
  for (const [queueKey, queue] of matchmakingQueues.entries()) {
    const idx = queue.findIndex((p) => p.userId === userId);
    if (idx !== -1) {
      queue.splice(idx, 1);
      broadcastQueueUpdate(queueKey);
    }
  }
}

function broadcastQueueUpdate(queueKey: string) {
  const queue = matchmakingQueues.get(queueKey) || [];
  const [exerciseId, durationRaw] = queueKey.split(':');
  const durationSeconds = Number(durationRaw);
  const count = queue.length;
  for (const player of queue) {
    if (player.ws.readyState === WebSocket.OPEN) {
      try {
        player.ws.send(JSON.stringify({
          type: 'battle_queue_update',
          exerciseId,
          queueCount: count,
          durationSeconds,
          joinedAt: player.joinedAt
        }));
      } catch {}
    }
  }
}

export function startDuel(
  exerciseId: string,
  p1: { userId: string; nick: string; avatar: string; ws: WebSocket },
  p2: { userId: string; nick: string; avatar: string; isBot: boolean; ws?: WebSocket },
  durationSeconds: number = 60
) {
  const matchId = `match_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const nonce = `nonce_${crypto.randomBytes(12).toString('hex')}_${Date.now()}`;
  const duration = normalizeDuration(durationSeconds);

  const session: BattleSession = {
    id: matchId,
    exerciseId,
    durationSeconds: duration,
    player1: {
      userId: p1.userId,
      nick: p1.nick,
      avatar: p1.avatar,
      reps: 0,
      accuracy: 100,
      lastRepTs: Date.now(),
      ws: p1.ws
    },
    player2: {
      userId: p2.userId,
      nick: p2.nick,
      avatar: p2.avatar,
      isBot: p2.isBot,
      reps: 0,
      accuracy: 100,
      lastRepTs: Date.now(),
      ws: p2.ws
    },
    remainingSeconds: duration,
    nonce,
    status: 'countdown',
    processedNonces: new Set()
  };

  activeBattles.set(matchId, session);

  // Send matched notification to Player 1
  if (p1.ws && p1.ws.readyState === WebSocket.OPEN) {
    try {
      p1.ws.send(JSON.stringify({
        type: 'battle_matched',
        matchId,
        exerciseId,
        nonce,
        opponent: {
          userId: p2.userId,
          nick: p2.nick,
          avatar: p2.avatar,
          isBot: p2.isBot
        }
      }));
    } catch {}
  }

  // Send matched notification to Player 2
  if (p2.ws && p2.ws.readyState === WebSocket.OPEN) {
    try {
      p2.ws.send(JSON.stringify({
        type: 'battle_matched',
        matchId,
        exerciseId,
        nonce,
        opponent: {
          userId: p1.userId,
          nick: p1.nick,
          avatar: p1.avatar,
          isBot: false
        }
      }));
    } catch {}
  }

  // 3-second countdown then start the selected-duration battle
  setTimeout(() => {
    if (session.status !== 'countdown') return;
    session.status = 'in_progress';
    broadcastToMatch(session, { type: 'battle_started', remainingSeconds: duration, durationSeconds: duration });
    startBattleClock(session);
  }, 3200);
}

function startBattleClock(session: BattleSession) {
  session.timer = setInterval(() => {
    session.remainingSeconds--;

    // Broadcast tick & tug-of-war balance
    const diff = session.player1.reps - session.player2.reps;
    const tugValue = Math.max(-50, Math.min(50, diff * 7));

    broadcastToMatch(session, {
      type: 'battle_tick',
      remainingSeconds: session.remainingSeconds,
      player1Reps: session.player1.reps,
      player2Reps: session.player2.reps,
      tugValue
    });

    if (session.remainingSeconds <= 0) {
      endDuel(session);
    }
  }, 1000);

  // If player 2 is bot, schedule natural reps
  if (session.player2.isBot) {
    const scheduleBot = () => {
      if (session.status !== 'in_progress') return;
      const delay = Math.random() * 1400 + 2000;
      session.botInterval = setTimeout(() => {
        if (session.status === 'in_progress') {
          session.player2.reps++;
          session.player2.lastRepTs = Date.now();
          
          // Broadcast bot rep to player 1
          if (session.player1.ws && session.player1.ws.readyState === WebSocket.OPEN) {
            try {
              session.player1.ws.send(JSON.stringify({
                type: 'battle_opponent_rep',
                reps: session.player2.reps,
                accuracy: 95
              }));
            } catch {}
          }

          scheduleBot();
        }
      }, delay);
    };
    scheduleBot();
  }
}

function playerWsFor(session: BattleSession, userId: string): WebSocket | undefined {
  if (session.player1.userId === userId) return session.player1.ws;
  if (session.player2.userId === userId) return session.player2.ws;
  return undefined;
}
function sendRepResult(ws: WebSocket|undefined, matchId: string, accepted: boolean, reason?: string, reps=0, accuracy=100) {
  if (ws?.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify({type:'battle_rep_result',matchId,accepted,reason,reps,accuracy})); } catch {}
  }
}

export function handleClientRep(matchId:string,userId:string,repData:{repNumber:number;rom:number;accuracy:number;nonce:string;errorType?:string}):boolean{
 const session=activeBattles.get(matchId); if(!session||session.status!=='in_progress'||session.remainingSeconds<=0)return false;
 const ws=playerWsFor(session,userId); const player=session.player1.userId===userId?session.player1:session.player2.userId===userId?session.player2:null;
 if(!player){sendRepResult(ws,matchId,false,'not_match_participant');return false;}
 if(repData.nonce!==session.nonce){sendRepResult(ws,matchId,false,'invalid_nonce',player.reps,player.accuracy);return false;}
 const repNumber=Number(repData.repNumber),rom=Number(repData.rom),accuracy=Number(repData.accuracy);
 if(!Number.isSafeInteger(repNumber)||repNumber!==player.reps+1){sendRepResult(ws,matchId,false,'rep_sequence',player.reps,player.accuracy);return false;}
 if(!Number.isFinite(rom)||rom<0||rom>100){sendRepResult(ws,matchId,false,'invalid_rom',player.reps,player.accuracy);return false;}
 if(!Number.isFinite(accuracy)||accuracy<0||accuracy>100){sendRepResult(ws,matchId,false,'invalid_accuracy',player.reps,player.accuracy);return false;}
 const rule=EXERCISE_RULES[session.exerciseId as keyof typeof EXERCISE_RULES]||EXERCISE_RULES.pushups; const now=Date.now();
 if(now-player.lastRepTs<rule.minRepMs){sendRepResult(ws,matchId,false,'rushing_tempo',player.reps,player.accuracy);return false;}
 if(rom<rule.minRom.standard){sendRepResult(ws,matchId,false,'incomplete_rom',player.reps,player.accuracy);return false;}
 const replayKey=`${session.id}:${userId}:${repNumber}`; if(session.processedNonces.has(replayKey)){sendRepResult(ws,matchId,false,'duplicate_rep',player.reps,player.accuracy);return false;}
 session.processedNonces.add(replayKey); player.reps++; player.lastRepTs=now; player.accuracy=Math.round(accuracy);
 sendRepResult(ws,matchId,true,undefined,player.reps,player.accuracy);
 const opponent=session.player1.userId===userId?session.player2:session.player1;
 if(opponent.ws?.readyState===WebSocket.OPEN)try{opponent.ws.send(JSON.stringify({type:'battle_opponent_rep',reps:player.reps,accuracy:player.accuracy}));}catch{}
 try{const db=getDatabase();db.prepare('INSERT INTO rep_events (id,match_id,user_id,rep_number,rom,accuracy,error_type,timestamp) VALUES (?,?,?,?,?,?,?,?)').run(`rep_${now}_${crypto.randomBytes(3).toString('hex')}`,session.id,userId,player.reps,rom,player.accuracy,null,now);}catch(e){console.error('Error recording rep event:',e);}
 return true;
}

export function handlePlayerDisconnect(userId: string) {
  // Check active battles
  for (const session of activeBattles.values()) {
    if (session.status !== 'in_progress') continue;
    
    if (session.player1.userId === userId) {
      session.player1.disconnectedAt = Date.now();
      // Notify player 2 about disconnect and start 10s countdown
      if (session.player2.ws && session.player2.ws.readyState === WebSocket.OPEN) {
        session.player2.ws.send(JSON.stringify({
          type: 'battle_opponent_disconnected',
          graceSeconds: 10
        }));
      }
      setTimeout(() => {
        if (session.status === 'in_progress' && session.player1.disconnectedAt) {
          endDuel(session, session.player2.userId, 'opponent_abandoned');
        }
      }, 10500);
    } else if (session.player2.userId === userId && !session.player2.isBot) {
      session.player2.disconnectedAt = Date.now();
      if (session.player1.ws && session.player1.ws.readyState === WebSocket.OPEN) {
        session.player1.ws.send(JSON.stringify({
          type: 'battle_opponent_disconnected',
          graceSeconds: 10
        }));
      }
      setTimeout(() => {
        if (session.status === 'in_progress' && session.player2.disconnectedAt) {
          endDuel(session, session.player1.userId, 'opponent_abandoned');
        }
      }, 10500);
    }
  }

  // Also remove from any matchmaking queue
  removeFromQueue(userId);
}

export function endDuel(session: BattleSession, forcedWinnerId?: string, reason?: string) {
  if (session.timer) clearInterval(session.timer);
  if (session.botInterval) clearTimeout(session.botInterval);
  session.status = 'finished';

  let winnerId: string | null = forcedWinnerId || null;
  if (!winnerId) {
    if (session.player1.reps > session.player2.reps) {
      winnerId = session.player1.userId;
    } else if (session.player2.reps > session.player1.reps) {
      winnerId = session.player2.userId;
    }
  }

  // Persist match in SQLite
  try {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO matches (
        id, exercise_id, player1_id, player2_id, player1_reps, player2_reps,
        player1_accuracy, player2_accuracy, winner_id, nonce, duration_seconds, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'finished', ?)
    `).run(
      session.id,
      session.exerciseId,
      session.player1.userId,
      session.player2.userId,
      session.player1.reps,
      session.player2.reps,
      session.player1.accuracy,
      session.player2.accuracy,
      winnerId,
      session.nonce,
      session.durationSeconds,
      Date.now()
    );

    // Update player 1 progress
    updateUserBattleRewards(session.player1.userId, session.player1.reps, winnerId === session.player1.userId, session.exerciseId);
    if (!session.player2.isBot) {
      updateUserBattleRewards(session.player2.userId, session.player2.reps, winnerId === session.player2.userId, session.exerciseId);
    }
  } catch (err) {
    console.error('Error storing match outcome:', err);
  }

  broadcastToMatch(session, {
    type: 'battle_finished',
    matchId: session.id,
    winnerId,
    reason: reason || 'completed',
    player1Reps: session.player1.reps,
    player2Reps: session.player2.reps,
    player1Accuracy: session.player1.accuracy,
    player2Accuracy: session.player2.accuracy
  });

  activeBattles.delete(session.id);
}

function updateUserBattleRewards(userId: string, reps: number, isWin: boolean, exerciseId: string) {
  const db = getDatabase();
  const xpGained = reps * 2 + (isWin ? 50 : 15);
  const row = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!row) return;

  const newXp = ((row.xp as number) || 0) + xpGained;
  const newWins = ((row.total_wins as number) || 0) + (isWin ? 1 : 0);
  const newLosses = ((row.total_losses as number) || 0) + (isWin ? 0 : 1);
  const newReps = ((row.total_reps as number) || 0) + reps;
  const currentLvl = (row.level as number) || 1;
  const newLevel = Math.max(currentLvl, Math.floor(Math.pow(newXp / 100, 1 / 1.35)) + 1);

  let exerciseReps: Record<string, number> = {};
  try {
    exerciseReps = JSON.parse((row.exercise_reps_json as string) || '{}');
  } catch {}
  exerciseReps[exerciseId] = (exerciseReps[exerciseId] || 0) + reps;

  db.prepare(`
    UPDATE progress SET
      xp = ?, level = ?, total_wins = ?, total_losses = ?, total_reps = ?, exercise_reps_json = ?
    WHERE user_id = ?
  `).run(newXp, newLevel, newWins, newLosses, newReps, JSON.stringify(exerciseReps), userId);

  // Check titles unlock
  if (isWin) {
    db.prepare('INSERT OR IGNORE INTO user_titles (id, user_id, title_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
      `title_${userId}_first_blood`,
      userId,
      'first_blood',
      Date.now()
    );
  }
  if (newWins >= 10) {
    db.prepare('INSERT OR IGNORE INTO user_titles (id, user_id, title_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
      `title_${userId}_gladiator`,
      userId,
      'gladiator',
      Date.now()
    );
  }
  if (newReps >= 100) {
    db.prepare('INSERT OR IGNORE INTO user_titles (id, user_id, title_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
      `title_${userId}_titan`,
      userId,
      'titan',
      Date.now()
    );
  }
}

function broadcastToMatch(session: BattleSession, data: Record<string, unknown>) {
  const msg = JSON.stringify(data);
  if (session.player1.ws && session.player1.ws.readyState === WebSocket.OPEN) {
    try { session.player1.ws.send(msg); } catch {}
  }
  if (session.player2.ws && session.player2.ws.readyState === WebSocket.OPEN) {
    try { session.player2.ws.send(msg); } catch {}
  }
}
