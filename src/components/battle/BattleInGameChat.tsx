import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Shield, Sparkles } from 'lucide-react';
import { authStore } from '../../services/authStore';

export interface BattleInGameChatProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  systemNotifications?: string[];
}

export interface InGameMessage {
  id: string;
  userNick: string;
  userAvatar: string;
  text: string;
  isSystem?: boolean;
  ts: number;
}

export const BattleInGameChat: React.FC<BattleInGameChatProps> = ({
  matchId,
  isOpen,
  onClose,
  systemNotifications = []
}) => {
  const user = authStore.getUser();
  const [messages, setMessages] = useState<InGameMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [lastSentTs, setLastSentTs] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize with system notification when match starts
  useEffect(() => {
    setMessages([
      {
        id: `sys_start_${Date.now()}`,
        userNick: 'FORGEMUSCLE',
        userAvatar: '⚔️',
        text: 'Бій розпочався! Покажи свою максимальну форму та чіткий ROM!',
        isSystem: true,
        ts: Date.now()
      }
    ]);
  }, [matchId]);

  // Append new system notifications
  useEffect(() => {
    if (systemNotifications.length > 0) {
      const latest = systemNotifications[systemNotifications.length - 1];
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}_${Math.random()}`,
          userNick: 'СИСТЕМА',
          userAvatar: '⚡',
          text: latest,
          isSystem: true,
          ts: Date.now()
        }
      ]);
    }
  }, [systemNotifications]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;

    // Anti-spam rate limit: 600ms
    const now = Date.now();
    if (now - lastSentTs < 600) return;
    setLastSentTs(now);

    const newMsg: InGameMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      userNick: user.nick,
      userAvatar: user.avatar,
      text: clean.substring(0, 140),
      ts: now
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-72 sm:h-80 w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <MessageSquare size={14} className="text-[var(--accent)]" />
          <span>Чат бою в реальному часі</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-xl flex items-start gap-2 ${
              m.isSystem
                ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-slate-200'
                : m.userNick === user.nick
                ? 'bg-[var(--bg-subtle)] border border-[var(--border-subtle)] ml-4'
                : 'bg-black/30 border border-white/5 mr-4'
            }`}
          >
            <span className="text-base shrink-0">{m.userAvatar}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-bold text-[11px] ${m.isSystem ? 'text-[var(--accent)]' : 'text-slate-300'}`}>
                  {m.userNick}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="text-[11px] text-slate-200 break-words leading-relaxed">
                {m.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="p-2 border-t border-[var(--border-subtle)] flex items-center gap-2 bg-[var(--bg-subtle)]">
        <input
          type="text"
          placeholder="Написати в чат бою..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={140}
          className="flex-1 bg-[var(--bg-card)] text-xs text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
