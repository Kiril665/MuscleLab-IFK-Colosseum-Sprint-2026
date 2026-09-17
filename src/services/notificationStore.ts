import { ForgeNotification } from '../types';
import { sound } from './soundEngine';

const SEED_NOTIFICATIONS: ForgeNotification[] = [
  {
    id: 'notif_1',
    type: 'best_answer',
    title: 'Кращу Відповідь обрано! 🏆',
    message: 'Тарас «Залізо» позначив вашу пораду щодо положення кистей як найкращу. +50 Reputation XP!',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: false,
    actionTab: 'community'
  },
  {
    id: 'notif_2',
    type: 'level_up',
    title: 'Ранг ковадла підвищено! ⚡',
    message: 'Ви досягли стадії «Гартована Сталь». Розблоковано нові варіанти суперсетів.',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    isRead: false,
    actionTab: 'profile_quests'
  },
  {
    id: 'notif_3',
    type: 'guild_invite',
    title: 'Запрошення до Гільдії 🛡️',
    message: 'Гільдія «Титани Турніків» запрошує вас приєднатися до щотижневого батлу за очки досвіду.',
    createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    isRead: true,
    actionTab: 'community'
  }
];

class NotificationStore {
  private notifications: ForgeNotification[] = SEED_NOTIFICATIONS;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.load();
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

  private load() {
    try {
      const saved = localStorage.getItem('forgemuscle_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch {
      this.notifications = SEED_NOTIFICATIONS;
    }
  }

  private save() {
    try {
      localStorage.setItem('forgemuscle_notifications', JSON.stringify(this.notifications));
    } catch {
      // ignore
    }
    this.notify();
  }

  public getNotifications(): ForgeNotification[] {
    return this.notifications;
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  public markAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      this.save();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach((n) => (n.isRead = true));
    this.save();
    sound.playClick();
  }

  public addNotification(type: ForgeNotification['type'], title: string, message: string, actionTab?: string) {
    const newN: ForgeNotification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionTab
    };
    this.notifications.unshift(newN);
    this.save();
    sound.playLevelUp();
  }
}

export const notificationStore = new NotificationStore();
