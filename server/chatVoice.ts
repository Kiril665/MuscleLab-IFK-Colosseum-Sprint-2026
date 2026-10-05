import { WebSocket } from 'ws';
import crypto from 'node:crypto';
import { getDatabase } from './db';
import { sanitizeChatMessage } from '../src/utils/moderation';
import { addToQueue, removeFromQueue, handleClientRep, startDuel, respondBattleInvite, handlePlayerDisconnect } from './battle';

export interface ConnectedClient {
  userId: string;
  nick: string;
  avatar: string;
  title: string;
  ws: WebSocket;
  activeVoiceRoomId?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
  lastMessageTs?: number;
}

export const clients = new Map<WebSocket, ConnectedClient>();

export function handleWebSocketConnection(ws: WebSocket) {
  const authUser = ws as any;
  const clientInfo: ConnectedClient = {
    userId: authUser.userId,
    nick: authUser.userNick || 'Атлет',
    avatar: authUser.userAvatar || '⚡',
    title: authUser.userTitle || 'Новачок',
    ws,
    isMuted: false,
    isSpeaking: false
  };

  clients.set(ws, clientInfo);

  // Send initial auth ack with server-verified identity
  try {
    ws.send(JSON.stringify({
      type: 'auth_ack',
      user: {
        id: clientInfo.userId,
        nick: clientInfo.nick,
        avatar: clientInfo.avatar,
        title: clientInfo.title
      }
    }));
  } catch {}

  // Broadcast updated presence
  broadcastOnlinePresence();

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const now = Date.now();

      switch (msg.type) {
        case 'battle_join_queue': addToQueue(msg.exerciseId||'pushups',{userId:clientInfo.userId,nick:clientInfo.nick,avatar:clientInfo.avatar,ws,durationSeconds:Number(msg.durationSeconds)||60}); break;
        case 'battle_leave_queue': removeFromQueue(clientInfo.userId); break;
        case 'battle_spar_bot': startDuel(msg.exerciseId||'pushups',{userId:clientInfo.userId,nick:clientInfo.nick,avatar:clientInfo.avatar,ws},{userId:'bot_taras',nick:'Тарас Залізний',avatar:'🤖',isBot:true},Number(msg.durationSeconds)||60); break;
        case 'battle_rep': handleClientRep(msg.matchId,clientInfo.userId,{repNumber:msg.repNumber,rom:msg.rom,accuracy:msg.accuracy,nonce:msg.nonce,errorType:msg.errorType}); break;
        case 'battle_invite_accept': respondBattleInvite(msg.inviteId,clientInfo.userId,true,clients); break;
        case 'battle_invite_decline': respondBattleInvite(msg.inviteId,clientInfo.userId,false,clients); break;

        case 'chat_message': {
          const rawText = (msg.text || '').trim();
          if (!rawText) return;

          // Rate limit: 1 message per 800ms
          if (clientInfo.lastMessageTs && now - clientInfo.lastMessageTs < 800) {
            ws.send(JSON.stringify({ type: 'error', message: 'Занадто часті повідомлення' }));
            return;
          }
          clientInfo.lastMessageTs = now;

          // Server-side moderation
          const { text: cleanText } = sanitizeChatMessage(rawText);
          const roomId = msg.roomId || 'global';
          const msgId = `msg_${now}_${crypto.randomBytes(3).toString('hex')}`;

          const db = getDatabase();
          db.prepare(
            'INSERT INTO chat_messages (id, room_id, user_id, user_nick, user_avatar, user_title, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(msgId, roomId, clientInfo.userId, clientInfo.nick, clientInfo.avatar, clientInfo.title, cleanText, now);

          // Broadcast to all clients
          broadcastToAll({
            type: 'chat_new_message',
            message: {
              id: msgId,
              roomId,
              userId: clientInfo.userId,
              userNick: clientInfo.nick,
              userAvatar: clientInfo.avatar,
              userTitle: clientInfo.title,
              text: cleanText,
              ts: now
            }
          });
          break;
        }

        case 'typing': {
          for (const target of clients.values()) {
            if (target.activeVoiceRoomId === (msg.roomId || 'global') && target.ws.readyState === WebSocket.OPEN) target.ws.send(JSON.stringify({
            type: 'user_typing',
            roomId: msg.roomId || 'global',
            userId: clientInfo.userId,
            nick: clientInfo.nick
            }));
          }
          break;
        }

        // WebRTC Mesh Voice Signaling
        case 'voice_join': {
          const roomId = msg.roomId;
          const db = getDatabase();
          const room = db.prepare('SELECT max_users FROM voice_rooms WHERE id=?').get(roomId) as {max_users:number}|undefined;
          const currentCount = Array.from(clients.values()).filter(c => c.activeVoiceRoomId === roomId).length;
          if (currentCount >= (room?.max_users ?? (roomId.startsWith('match_') ? 2 : 8)) && clientInfo.activeVoiceRoomId !== roomId) { ws.send(JSON.stringify({type:'voice_room_error',message:'Voice room is full'})); return; }
          clientInfo.activeVoiceRoomId = roomId;
          clientInfo.isMuted = Boolean(msg.isMuted);
          clientInfo.isSpeaking = false;

          // Notify other participants in room
          broadcastVoiceRoomState(roomId);
          break;
        }

        case 'voice_leave': {
          const prevRoom = clientInfo.activeVoiceRoomId;
          clientInfo.activeVoiceRoomId = undefined;
          clientInfo.isSpeaking = false;
          if (prevRoom) {
            broadcastVoiceRoomState(prevRoom);
          }
          break;
        }

        case 'voice_signal': {
          // Direct WebRTC SDP/ICE Relay to target user
          const { targetUserId, signal } = msg;
          if (!targetUserId || !signal) return;

          for (const client of clients.values()) {
            if (client.userId === targetUserId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(
                JSON.stringify({
                  type: 'voice_signal',
                  fromUserId: clientInfo.userId,
                  signal
                })
              );
              break;
            }
          }
          break;
        }

        case 'voice_speaking': {
          clientInfo.isSpeaking = Boolean(msg.isSpeaking);
          if (clientInfo.activeVoiceRoomId) {
            broadcastVoiceRoomState(clientInfo.activeVoiceRoomId);
          }
          break;
        }

        case 'voice_mute': {
          clientInfo.isMuted = Boolean(msg.isMuted);
          if (clientInfo.activeVoiceRoomId) {
            broadcastVoiceRoomState(clientInfo.activeVoiceRoomId);
          }
          break;
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    const prevRoom = clientInfo?.activeVoiceRoomId;
    clients.delete(ws);
    if (!Array.from(clients.values()).some(c => c.userId === clientInfo.userId)) handlePlayerDisconnect(clientInfo.userId);

    if (prevRoom) {
      broadcastVoiceRoomState(prevRoom);
    }
    broadcastOnlinePresence();
  });
}

export function broadcastToAll(data: Record<string, any>) {
  const payload = JSON.stringify(data);
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch {}
    }
  }
}

export function broadcastOnlinePresence() {
  const uniqueUsers = new Map<string, { id: string; nick: string; avatar: string; title: string }>();
  for (const client of clients.values()) {
    if (!uniqueUsers.has(client.userId)) {
      uniqueUsers.set(client.userId, {
        id: client.userId,
        nick: client.nick,
        avatar: client.avatar,
        title: client.title
      });
    }
  }

  broadcastToAll({
    type: 'presence_update',
    onlineCount: uniqueUsers.size,
    users: Array.from(uniqueUsers.values())
  });
}

export function broadcastVoiceRoomState(roomId: string) {
  const participants: {
    userId: string;
    nick: string;
    avatar: string;
    title: string;
    isMuted: boolean;
    isSpeaking: boolean;
  }[] = [];

  for (const client of clients.values()) {
    if (client.activeVoiceRoomId === roomId && client.ws.readyState === WebSocket.OPEN) {
      participants.push({
        userId: client.userId,
        nick: client.nick,
        avatar: client.avatar,
        title: client.title,
        isMuted: Boolean(client.isMuted),
        isSpeaking: Boolean(client.isSpeaking)
      });
    }
  }

  broadcastToAll({
    type: 'voice_room_update',
    roomId,
    participants
  });
}
