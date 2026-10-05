import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Zap, MessageSquare, Flame } from 'lucide-react';
import { authStore } from '../../services/authStore';
import { LeaderboardEntry } from '../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Modal } from '../../ui/Modal';
import { Avatar } from '../../ui/Avatar';

export interface LeaderboardViewProps {
  onChallengePlayer: (nick: string) => void;
  onOpenChatWithPlayer: (nick: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onChallengePlayer,
  onOpenChatWithPlayer
}) => {
  const [metric, setMetric] = useState<'xp' | 'wins' | 'reps'>('xp');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [selectedAthlete, setSelectedAthlete] = useState<LeaderboardEntry | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const currentUser = authStore.getUser();

  useEffect(() => {
    fetch(`/api/leaderboard?metric=${metric}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.entries && data.entries.length > 0) {
          const list = data.entries.map((item: Record<string, unknown>, idx: number) => ({
            rank: idx + 1,
            userId: item.userId,
            nick: item.nick,
            avatar: item.avatar || '⚡',
            activeTitle: item.activeTitle || 'Новачок',
            xp: Number(item.xp) || 0,
            wins: Number(item.wins) || 0,
            reps: Number(item.reps) || 0,
            isCurrentUser: item.userId === currentUser.id
          }));
          setEntries(list);
        } else {
          // If no rows yet, add current user
          setEntries([
            {
              rank: 1,
              userId: currentUser.id,
              nick: currentUser.nick,
              avatar: currentUser.avatar,
              activeTitle: 'Новачок',
              xp: 0,
              wins: 0,
              reps: 0,
              isCurrentUser: true
            }
          ]);
        }
      })
      .catch(() => {});
  }, [metric, period, currentUser.id, currentUser.nick, currentUser.avatar]);

  const currentUserEntry = entries.find((e) => e.isCurrentUser);

  return (
    <div className="flex flex-col gap-4 pb-28 max-w-4xl mx-auto w-full px-4 pt-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="text-[var(--accent)]" />
            Таблиця лідерів
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Змагайся за найвищий ранг серед атлетів Кузні
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)] text-xs">
          {[
            { id: 'week', label: 'Тиждень' },
            { id: 'month', label: 'Місяць' },
            { id: 'all', label: 'Весь час' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as typeof period)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-[var(--accent)] text-white font-bold shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)]">
        {[
          { id: 'xp', label: 'За досвідом (XP)', icon: <Zap size={14} /> },
          { id: 'wins', label: 'За перемогами', icon: <Swords size={14} /> },
          { id: 'reps', label: 'За повторами', icon: <Flame size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMetric(tab.id as typeof metric)}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              metric === tab.id
                ? 'bg-[var(--bg-subtle)] text-[var(--accent)] border border-[var(--accent)]/40 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Top 3 Podium with Crown Accent */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          {entries.slice(0, 3).map((entry, idx) => {
            const podiumRank = idx + 1;
            return (
              <div
                key={entry.userId}
                onClick={() => setSelectedAthlete(entry)}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                  podiumRank === 1
                    ? 'bg-[var(--bg-card)] border-[var(--accent)] shadow-xl shadow-[var(--accent)]/15 order-2 -mt-2'
                    : podiumRank === 2
                    ? 'bg-[var(--bg-card)] border-[var(--border-subtle)] order-1'
                    : 'bg-[var(--bg-card)] border-[var(--border-subtle)] order-3'
                }`}
              >
                <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">
                  {podiumRank === 1 ? '👑 1 місце' : podiumRank === 2 ? '🥈 2 місце' : '🥉 3 місце'}
                </div>
                <div className="mb-1"><Avatar avatar={entry.avatar} size="sm" alt={entry.nick} /></div>
                <div className="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate max-w-full">
                  {entry.nick}
                </div>
                <div className="text-[10px] text-[var(--accent)] font-medium truncate max-w-full mb-1">
                  {entry.activeTitle}
                </div>
                <div className="font-heading font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                  {metric === 'xp' ? `${entry.xp} XP` : metric === 'wins' ? `${entry.wins} вигр` : `${entry.reps} повт`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table Rows */}
      <div className="flex flex-col gap-2 pt-2">
        {entries.map((entry) => {
          const isMe = entry.isCurrentUser;
          return (
            <div
              key={entry.userId}
              onClick={() => setSelectedAthlete(entry)}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                isMe
                  ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 font-heading font-bold text-center text-xs ${
                    entry.rank <= 3 ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  #{entry.rank}
                </span>

                <Avatar avatar={entry.avatar} size="sm" alt={entry.nick} />

                <div>
                  <div className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <span>{entry.nick}</span>
                    {isMe && <Badge variant="accent" size="sm">Це ти</Badge>}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {entry.activeTitle}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-heading font-black text-sm sm:text-base text-[var(--text-primary)]">
                  {metric === 'xp' && `${entry.xp} XP`}
                  {metric === 'wins' && `${entry.wins} перемог`}
                  {metric === 'reps' && `${entry.reps} повторів`}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {metric === 'xp' ? `${entry.wins} виграшів` : `${entry.xp} XP`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Rank Bar */}
      {currentUserEntry && (
        <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 max-w-4xl mx-auto z-30">
          <div className="bg-[var(--bg-card)]/95 backdrop-blur-md border-2 border-[var(--accent)] rounded-2xl p-3.5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="font-heading font-black text-sm text-[var(--accent)]">
                #{currentUserEntry.rank}
              </span>
              <Avatar avatar={currentUserEntry.avatar} size="sm" alt={currentUserEntry.nick} />
              <div>
                <div className="font-heading font-bold text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <span>{currentUserEntry.nick}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">({currentUserEntry.activeTitle})</span>
                </div>
                <div className="text-[11px] text-[var(--accent)]">
                  Твоя позиція в таблиці
                </div>
              </div>
            </div>

            <div className="text-right font-heading font-black text-sm sm:text-base text-[var(--accent)]">
              {metric === 'xp' ? `${currentUserEntry.xp} XP` : metric === 'wins' ? `${currentUserEntry.wins} виграшів` : `${currentUserEntry.reps} повт`}
            </div>
          </div>
        </div>
      )}

      {/* Athlete Detail Action Modal */}
      {selectedAthlete && (
        <Modal
          isOpen={!!selectedAthlete}
          onClose={() => setSelectedAthlete(null)}
          title="Профіль атлета"
          maxWidth="sm"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <Avatar avatar={selectedAthlete.avatar} size="xl" alt={selectedAthlete.nick} />
            <div>
              <h4 className="font-heading font-bold text-lg text-[var(--text-primary)]">
                {selectedAthlete.nick}
              </h4>
              <Badge variant="accent" size="sm" className="mt-1">
                {selectedAthlete.activeTitle}
              </Badge>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 bg-[var(--bg-subtle)] p-3 rounded-xl border border-[var(--border-subtle)] text-xs">
              <div>
                <div className="text-[var(--text-secondary)]">XP</div>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">{selectedAthlete.xp}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Перемоги</div>
                <div className="font-bold text-[var(--accent)] mt-0.5">{selectedAthlete.wins}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Повтори</div>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">{selectedAthlete.reps}</div>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  const nick = selectedAthlete.nick;
                  setSelectedAthlete(null);
                  onChallengePlayer(nick);
                }}
              >
                <Swords size={16} className="mr-1.5" />
                Викликати
              </Button>

              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const nick = selectedAthlete.nick;
                  setSelectedAthlete(null);
                  onOpenChatWithPlayer(nick);
                }}
              >
                <MessageSquare size={16} className="mr-1.5" />
                Написати
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
