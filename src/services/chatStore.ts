import { ChatMessage, Friend } from '../types';
import { authStore } from './authStore';
import { storageManager } from './storageManager';

export interface ChatRoom {
  id: string;
  name: string;
  type: 'global' | 'direct' | 'match';
  targetUserId?: string;
  unreadCount: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_sys_1',
    roomId: 'global',
    userId: 'system',
    userNick: 'ForgeBot',
    userAvatar: '⚡',
    userTitle: 'Система',
    text: 'Ласкаво просимо в загальний чат ForgeMuscle! Поважай інших атлетів та ділися результатами дуелей.',
    ts: Date.now() - 3600000,
    isSystem: true
  },
  {
    id: 'msg_2',
    roomId: 'global',
    userId: 'ath_1',
    userNick: 'Олександр Скеля',
    userAvatar: '🦁',
    userTitle: 'Титан повторів',
    text: 'Хто готовий до 60 секунд відтискань? Кидайте виклик!',
    ts: Date.now() - 1800000
  },
  {
    id: 'msg_3',
    roomId: 'global',
    userId: 'ath_2',
    userNick: 'Дарина Фордж',
    userAvatar: '⚡',
    userTitle: 'Майстер техніки',
    text: 'Сьогодні відпрацювала присідання на 98% глибини. Камера чітко бачить кут.',
    ts: Date.now() - 600000
  }
];

class ChatStore {
  private messages: ChatMessage[] = [];
  private blockedUserIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  private typingUsers: Map<string, string> = new Map(); // roomId -> userNick
  private lastSentTime: number = 0;

  constructor() {
    this.messages = this.loadMessages();
    this.blockedUserIds = this.loadBlockedUsers();
  }

  private loadMessages(): ChatMessage[] {
    try {
      const chatSlice = storageManager.getSlice<{ messages?: ChatMessage[]; blockedUsers?: string[] }>('chat');
      if (chatSlice && chatSlice.messages && Array.isArray(chatSlice.messages)) {
        return chatSlice.messages;
      }
    } catch {}
    return [...INITIAL_MESSAGES];
  }

  private loadBlockedUsers(): Set<string> {
    try {
      const chatSlice = storageManager.getSlice<{ messages?: ChatMessage[]; blockedUsers?: string[] }>('chat');
      if (chatSlice && chatSlice.blockedUsers && Array.isArray(chatSlice.blockedUsers)) {
        return new Set(chatSlice.blockedUsers);
      }
    } catch {}
    return new Set();
  }

  private saveMessages() {
    try {
      const chatSlice = storageManager.getSlice<{ messages?: ChatMessage[]; blockedUsers?: string[] }>('chat') || {};
      storageManager.setSlice('chat', {
        ...chatSlice,
        messages: this.messages.slice(-150)
      });
    } catch {}
    this.notify();
  }

  private saveBlockedUsers() {
    try {
      const chatSlice = storageManager.getSlice<{ messages?: ChatMessage[]; blockedUsers?: string[] }>('chat') || {};
      storageManager.setSlice('chat', {
        ...chatSlice,
        blockedUsers: Array.from(this.blockedUserIds)
      });
    } catch {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getMessages(roomId: string): ChatMessage[] {
    return this.messages.filter(
      (m) => m.roomId === roomId && !this.blockedUserIds.has(m.userId)
    );
  }

  public sendMessage(roomId: string, text: string): { success: boolean; error?: string } {
    const clean = text.trim();
    if (!clean) return { success: false, error: 'Повідомлення не може бути порожнім' };

    // Anti-spam rate limiting: 1 message per 1.2 seconds
    const now = Date.now();
    if (now - this.lastSentTime < 1200) {
      return { success: false, error: 'Занадто часті повідомлення. Зачекайте секунду.' };
    }
    this.lastSentTime = now;

    // Basic profanity / bad pattern moderation filter
    const lower = clean.toLowerCase();
    const forbidden = ['казино', 'crypto-scam', 't.me/free_money'];
    if (forbidden.some((word) => lower.includes(word))) {
      return { success: false, error: 'Повідомлення відхилено системою антиспаму' };
    }

    const user = authStore.getUser();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      userId: user.id,
      userNick: user.nick,
      userAvatar: user.avatar,
      text: clean,
      ts: now
    };

    this.messages.push(newMsg);
    this.saveMessages();

    // Auto-bot reply in global room to keep atmosphere lively
    if (roomId === 'global' && (clean.includes('привіт') || clean.includes('дуель') || clean.includes('хто'))) {
      setTimeout(() => {
        const botResponses = [
          'Я готовий до дуелі! Заходь у Battle.',
          'Відмінний настрій на тренування! Рухаємось до вершини рейтингу.',
          'Краса! Головне — тримати повну амплітуду понад 85%.'
        ];
        const randomResp = botResponses[Math.floor(Math.random() * botResponses.length)];
        this.messages.push({
          id: `msg_bot_${Date.now()}`,
          roomId: 'global',
          userId: 'ath_4',
          userNick: 'Тарас Залізний',
          userAvatar: '🤖',
          userTitle: 'Залізна воля',
          text: randomResp,
          ts: Date.now()
        });
        this.saveMessages();
      }, 1500);
    }

    return { success: true };
  }

  public blockUser(userId: string) {
    this.blockedUserIds.add(userId);
    this.saveBlockedUsers();
  }

  public unblockUser(userId: string) {
    this.blockedUserIds.delete(userId);
    this.saveBlockedUsers();
  }

  public reportMessage(messageId: string, reason: string): boolean {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) return false;
    // Log report and automatically hide for current session
    this.blockUser(msg.userId);
    return true;
  }

  public isBlocked(userId: string): boolean {
    return this.blockedUserIds.has(userId);
  }

  public isUserBlocked(userId: string): boolean {
    return this.isBlocked(userId);
  }

  public getTypingUser(roomId: string): string | undefined {
    return this.typingUsers.get(roomId);
  }
}

export const chatStore = new ChatStore();

export const INITIAL_FRIENDS: Friend[] = [
  { userId: 'ath_1', nick: 'Олександр Скеля', avatar: '🦁', title: 'Титан повторів', isOnline: true, statusText: 'Готовий до дуелі' },
  { userId: 'ath_2', nick: 'Дарина Фордж', avatar: '⚡', title: 'Майстер техніки', isOnline: true, statusText: 'На тренуванні' },
  { userId: 'ath_3', nick: 'Макс Вовк', avatar: '🐺', title: 'Гладіатор', isOnline: false, statusText: 'Був 2 год тому' },
  { userId: 'ath_4', nick: 'Тарас Залізний', avatar: '🤖', title: 'Залізна воля', isOnline: true, statusText: 'ШІ-спаринг' }
];
