import { ChatMessage, ChatRoom, FriendConnection } from '../types';
import { sound } from './soundEngine';
import { arnoVoice } from './arnoVoice';
import { authStore } from './authStore';

export const DEFAULT_CHAT_ROOMS: ChatRoom[] = [
  { id: 'room_bodybuilding', name: 'Бодибілдинг & Залізо', topic: 'Гіпертрофія, прогресивне навантаження та симетрія мʼязів', icon: '🏋️', membersOnline: 38, category: 'public' },
  { id: 'room_calisthenics', name: 'Калістеніка & Воркаут', topic: 'Турніки, бруси, горизонт, передній вис та виходи силою', icon: '🤸', membersOnline: 45, category: 'public' },
  { id: 'room_home', name: 'Домашня Кузня', topic: 'Тренування з гантелями, гумою та власною вагою вдома', icon: '🏠', membersOnline: 24, category: 'public' },
  { id: 'room_beginners', name: 'Старт у Кузні (Новачки)', topic: 'Безпечні перші кроки, техніка без травм, база знань', icon: '🌱', membersOnline: 52, category: 'public' },
  { id: 'room_nutrition', name: 'Раціон & Нутрієнти', topic: 'Збалансоване спортивне харчування, білок та гідратація', icon: '🥗', membersOnline: 31, category: 'public' },
  { id: 'room_recovery', name: 'Відновлення & Сон', topic: 'Мобільність, розтяжка, стретчинг, відновлення звʼязок', icon: '🧘', membersOnline: 19, category: 'public' },
  { id: 'room_gaming', name: 'Forge Gaming & RPG', topic: 'XP, ранги ковадла, аватари, косметика та квести', icon: '🎮', membersOnline: 29, category: 'public' },
  { id: 'room_battle', name: 'Арена Battle Mode', topic: 'Битва між таборами Бодибілдингу та Калістеніки', icon: '⚔️', membersOnline: 64, category: 'public' },
  { id: 'room_guild', name: 'Чат Моєї Гільдії', topic: 'Внутрішня координація учасників гільдії та спільний досвід', icon: '🛡️', membersOnline: 14, category: 'guild' }
];

const SEED_FRIENDS: FriendConnection[] = [
  {
    id: 'fr_1',
    userId: 'usr_forge_taras',
    username: 'Тарас «Залізо»',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    level: 28,
    discipline: 'calisthenics',
    reputationRank: 'Mentor',
    status: 'online',
    mutualGuild: 'Титани Турніків',
    mutualBattle: 'Турнір Воркауту #12',
    requestStatus: 'accepted'
  },
  {
    id: 'fr_2',
    userId: 'usr_forge_arnold',
    username: 'Арнольд Сталевий',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces',
    level: 19,
    discipline: 'bodybuilding',
    reputationRank: 'Master',
    status: 'training',
    mutualGuild: 'Братство Заліза',
    requestStatus: 'accepted'
  },
  {
    id: 'fr_3',
    userId: 'usr_forge_artur',
    username: 'Артур Новак',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
    level: 11,
    discipline: 'hybrid',
    reputationRank: 'Helper',
    status: 'offline',
    requestStatus: 'accepted'
  }
];

class ChatStore {
  private rooms: ChatRoom[] = DEFAULT_CHAT_ROOMS;
  private messages: Record<string, ChatMessage[]> = {};
  private friends: FriendConnection[] = SEED_FRIENDS;
  private blockedUsers: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  
  private activeChannelId: string = 'room_calisthenics';
  private eventSource: EventSource | null = null;
  private pollInterval: any = null;
  private connectionStatus: 'live' | 'polling' | 'connecting' | 'error' = 'connecting';
  private hasInitialFetch: Set<string> = new Set();

  constructor() {
    this.loadLocalCache();
    this.setActiveChannel('room_calisthenics');
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private loadLocalCache() {
    try {
      const savedFriends = localStorage.getItem('forgemuscle_friends');
      if (savedFriends) {
        this.friends = JSON.parse(savedFriends);
      }
      const savedBlocked = localStorage.getItem('forgemuscle_blocked_users');
      if (savedBlocked) {
        this.blockedUsers = new Set(JSON.parse(savedBlocked));
      }
    } catch {
      // ignore
    }
  }

  private saveLocalSettings() {
    try {
      localStorage.setItem('forgemuscle_friends', JSON.stringify(this.friends));
      localStorage.setItem('forgemuscle_blocked_users', JSON.stringify(Array.from(this.blockedUsers)));
    } catch {
      // ignore
    }
    this.notify();
  }

  public getConnectionStatus(): 'live' | 'polling' | 'connecting' | 'error' {
    return this.connectionStatus;
  }

  public getRooms(): ChatRoom[] {
    return this.rooms;
  }

  public getFriends(): FriendConnection[] {
    return this.friends;
  }

  public setActiveChannel(channelId: string) {
    if (this.activeChannelId === channelId && this.eventSource) {
      return;
    }
    this.activeChannelId = channelId;
    this.fetchMessages(channelId);
    this.connectRealtimeStream(channelId);
  }

  public getMessages(channelId: string): ChatMessage[] {
    if (!this.hasInitialFetch.has(channelId)) {
      this.hasInitialFetch.add(channelId);
      this.fetchMessages(channelId);
    }
    const list = this.messages[channelId] || [];
    return list.filter((m) => !this.blockedUsers.has(m.authorId));
  }

  // Fetch messages from backend
  public async fetchMessages(channelId: string, silent: boolean = false): Promise<ChatMessage[]> {
    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(channelId)}/messages`);
      if (res.ok) {
        const data = await res.json();
        const serverMessages: ChatMessage[] = data.messages || [];
        
        const prevCount = (this.messages[channelId] || []).length;
        this.messages[channelId] = serverMessages;
        
        if (!silent || serverMessages.length !== prevCount) {
          this.notify();
        }
        return serverMessages;
      }
    } catch (err) {
      console.warn('Failed to fetch messages for channel', channelId, err);
    }
    return this.messages[channelId] || [];
  }

  // Real-time EventSource connection with polling fallback
  private connectRealtimeStream(channelId: string) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.connectionStatus = 'connecting';
    this.notify();

    if (typeof EventSource !== 'undefined') {
      try {
        const streamUrl = `/api/chat/${encodeURIComponent(channelId)}/stream`;
        const es = new EventSource(streamUrl);
        this.eventSource = es;

        es.addEventListener('init', () => {
          this.connectionStatus = 'live';
          this.notify();
        });

        es.addEventListener('message_created', (e) => {
          try {
            const newMsg: ChatMessage = JSON.parse(e.data);
            if (!this.messages[channelId]) {
              this.messages[channelId] = [];
            }
            const existingIdx = this.messages[channelId].findIndex((m) => m.id === newMsg.id);
            if (existingIdx >= 0) {
              this.messages[channelId][existingIdx] = newMsg;
            } else {
              this.messages[channelId].push(newMsg);
              sound.playClick();
            }
            this.notify();
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        es.addEventListener('message_updated', (e) => {
          try {
            const updatedMsg: ChatMessage = JSON.parse(e.data);
            if (this.messages[channelId]) {
              const idx = this.messages[channelId].findIndex((m) => m.id === updatedMsg.id);
              if (idx >= 0) {
                this.messages[channelId][idx] = updatedMsg;
                this.notify();
              }
            }
          } catch (err) {
            console.error('SSE parse update error:', err);
          }
        });

        es.addEventListener('message_deleted', (e) => {
          try {
            const deletedMsg: ChatMessage = JSON.parse(e.data);
            if (this.messages[channelId]) {
              const idx = this.messages[channelId].findIndex((m) => m.id === deletedMsg.id);
              if (idx >= 0) {
                this.messages[channelId][idx] = deletedMsg;
                this.notify();
              }
            }
          } catch (err) {
            console.error('SSE parse delete error:', err);
          }
        });

        es.addEventListener('reaction_toggled', (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (this.messages[channelId]) {
              const msg = this.messages[channelId].find((m) => m.id === payload.messageId);
              if (msg) {
                msg.reactions = payload.reactions;
                this.notify();
              }
            }
          } catch (err) {
            console.error('SSE parse reaction error:', err);
          }
        });

        es.onerror = () => {
          this.connectionStatus = 'polling';
          this.notify();
        };
      } catch {
        this.connectionStatus = 'polling';
        this.notify();
      }
    } else {
      this.connectionStatus = 'polling';
      this.notify();
    }

    // Polling fallback to guarantee continuous multi-user synchronization
    this.pollInterval = setInterval(() => {
      this.fetchMessages(channelId, true);
    }, 3500);
  }

  // Send message to server (author validated on server)
  public async sendMessage(channelId: string, content: string, replyTo?: ChatMessage['replyToMessage']): Promise<ChatMessage> {
    const text = content.trim();
    if (!text) throw new Error('Порожнє повідомлення');

    const headers = authStore.getAuthHeaders();
    if (!authStore.getToken()) {
      throw new Error('Для відправки повідомлення необхідно увійти в акаунт Кузні.');
    }

    const res = await fetch(`/api/chat/${encodeURIComponent(channelId)}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: text, replyTo })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Не вдалося надіслати повідомлення на сервер.');
    }

    const data = await res.json();
    const serverMsg: ChatMessage = data.message;

    if (!this.messages[channelId]) {
      this.messages[channelId] = [];
    }
    if (!this.messages[channelId].some((m) => m.id === serverMsg.id)) {
      this.messages[channelId].push(serverMsg);
    }
    this.notify();
    sound.playClick();
    return serverMsg;
  }

  // Toggle reaction on server with immediate responsive feedback
  public async toggleReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    const currentUser = authStore.getCurrentUser();
    if (!currentUser || !authStore.getToken()) {
      throw new Error('Для додавання реакції необхідно увійти в акаунт.');
    }

    // Optimistic local update
    const channel = this.messages[channelId];
    if (channel) {
      const msg = channel.find((m) => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const currentList = msg.reactions[emoji] || [];
        const idx = currentList.indexOf(currentUser.id);
        if (idx >= 0) {
          currentList.splice(idx, 1);
          if (currentList.length === 0) {
            delete msg.reactions[emoji];
          }
        } else {
          currentList.push(currentUser.id);
          msg.reactions[emoji] = currentList;
        }
        this.notify();
      }
    }
    sound.playClick();

    try {
      const res = await fetch(`/api/chat/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
        method: 'POST',
        headers: authStore.getAuthHeaders(),
        body: JSON.stringify({ emoji })
      });

      if (res.ok) {
        const data = await res.json();
        if (channel) {
          const msg = channel.find((m) => m.id === messageId);
          if (msg && data.reactions) {
            msg.reactions = data.reactions;
            this.notify();
          }
        }
      }
    } catch (err) {
      console.warn('Reaction error:', err);
    }
  }

  // Edit message on server (author only)
  public async editMessage(channelId: string, messageId: string, newContent: string): Promise<void> {
    const text = newContent.trim();
    if (!text) return;

    const res = await fetch(`/api/chat/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
      method: 'PUT',
      headers: authStore.getAuthHeaders(),
      body: JSON.stringify({ content: text })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не вдалося відредагувати повідомлення');
    }

    const data = await res.json();
    if (this.messages[channelId]) {
      const idx = this.messages[channelId].findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        this.messages[channelId][idx] = data.message;
        this.notify();
      }
    }
    sound.playClick();
  }

  // Soft-delete message on server (author only)
  public async deleteMessage(channelId: string, messageId: string): Promise<void> {
    const res = await fetch(`/api/chat/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}`, {
      method: 'DELETE',
      headers: authStore.getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не вдалося видалити повідомлення');
    }

    const data = await res.json();
    if (this.messages[channelId]) {
      const idx = this.messages[channelId].findIndex((m) => m.id === messageId);
      if (idx >= 0) {
        this.messages[channelId][idx] = data.message;
        this.notify();
      }
    }
    sound.playClick();
  }

  public blockUser(userId: string) {
    this.blockedUsers.add(userId);
    this.saveLocalSettings();
    sound.playClick();
    arnoVoice.speak('Користувача заблоковано в чаті.');
  }

  public addFriend(username: string) {
    const newFr: FriendConnection = {
      id: `fr_${Date.now()}`,
      userId: `user_${Date.now()}`,
      username,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
      level: 1,
      discipline: 'hybrid',
      reputationRank: 'Newcomer',
      status: 'online',
      requestStatus: 'accepted'
    };
    this.friends.unshift(newFr);
    this.saveLocalSettings();
    sound.playClick();
    arnoVoice.speak(`Атлета ${username} додано до ваших тренувальних звʼязків!`);
  }
}

export const chatStore = new ChatStore();
