import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Medal, 
  Crown, 
  RefreshCw, 
  ChevronRight, 
  UserPlus, 
  Shirt, 
  Sparkles,
  Search
} from 'lucide-react';
import { sound } from '../services/soundEngine';

interface LeaderboardEntry {
  rank: number;
  athleteName: string;
  wallet: string;
  userId: string;
  avatar?: string;
  value: number;
  currentStreakDays: number;
  forgeTier: string;
  totalVerifiedReps: number;
}

interface LeaderboardData {
  exercise: string;
  period: string;
  totalAthletes: number;
  leaderboard: LeaderboardEntry[];
  currentUserRank: LeaderboardEntry | null;
}

interface LeaderboardProps {
  onOpenInviteModal?: () => void;
  onOpenWardrobeModal?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  onOpenInviteModal, 
  onOpenWardrobeModal 
}) => {
  const [exercise, setExercise] = useState<'all' | 'pushups' | 'squats' | 'pullups'>('all');
  const [period, setPeriod] = useState<'allTime' | 'monthly' | 'weekly'>('allTime');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?exercise=${exercise}&period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [exercise, period]);

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'legendary_forge': return { text: 'Легенда Forge', color: 'text-amber-400 bg-amber-950/80 border-amber-500/50' };
      case 'tempered_steel': return { text: 'Гартована Сталь', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50' };
      case 'fire_aura': return { text: 'Вогняна Аура', color: 'text-orange-400 bg-orange-950/80 border-orange-500/50' };
      case 'armor': return { text: 'Броньований', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50' };
      case 'muscles': return { text: 'Атлет', color: 'text-blue-400 bg-blue-950/80 border-blue-500/50' };
      case 'forged': return { text: 'Викований', color: 'text-neutral-300 bg-neutral-900 border-neutral-700' };
      default: return { text: 'Новачок', color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
    }
  };

  const filteredList = (data?.leaderboard || []).filter(item => 
    !searchQuery || 
    item.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = filteredList.slice(0, 3);
  const restList = filteredList.slice(3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-neutral-900 to-orange-950/50 border border-amber-500/30 p-5 sm:p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Верифікований рейтинг ліги
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-wide">
              ТАБЛИЦЯ ЛІДЕРІВ FORGEMUSCLE
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Тільки чисті, компʼютерно підтверджені повторення через CV-камеру. Стріки розраховуються щоденно за журналом перевірених сесій.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenInviteModal && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenInviteModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer font-heading"
              >
                <UserPlus className="w-4 h-4" />
                Викликати друга
              </button>
            )}

            {onOpenWardrobeModal && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenWardrobeModal();
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-heading"
              >
                <Shirt className="w-4 h-4 text-amber-400" />
                Гардероб Forge
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                fetchLeaderboard();
              }}
              title="Оновити рейтинг"
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800">
        {/* Exercise Filter */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800/80">
          {[
            { id: 'all', label: 'Всі вправи' },
            { id: 'pushups', label: 'Віджимання' },
            { id: 'squats', label: 'Присідання' },
            { id: 'pullups', label: 'Підтягування' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setExercise(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exercise === tab.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800/80 self-start sm:self-auto">
          {[
            { id: 'allTime', label: 'Весь час' },
            { id: 'monthly', label: '30 днів' },
            { id: 'weekly', label: '7 днів' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                sound.playClick();
                setPeriod(p.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium (Gold, Silver, Bronze) */}
      {!isLoading && top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {top3.map((entry, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const tier = getTierLabel(entry.forgeTier);

            return (
              <div
                key={entry.userId || entry.wallet}
                className={`relative overflow-hidden rounded-2xl p-4 flex flex-col items-center text-center transition-all ${
                  isFirst
                    ? 'bg-gradient-to-b from-amber-950/60 via-neutral-900 to-neutral-950 border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.2)] sm:-translate-y-2 order-1 sm:order-2'
                    : isSecond
                    ? 'bg-gradient-to-b from-neutral-800/60 via-neutral-900 to-neutral-950 border border-neutral-600/80 order-2 sm:order-1'
                    : 'bg-gradient-to-b from-orange-950/40 via-neutral-900 to-neutral-950 border border-orange-700/60 order-3'
                }`}
              >
                {/* Crown or Medal Badge */}
                <div className="absolute top-3 right-3">
                  {isFirst ? (
                    <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                  ) : (
                    <Medal className={`w-5 h-5 ${isSecond ? 'text-neutral-300' : 'text-orange-400'}`} />
                  )}
                </div>

                {/* Rank Number */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black font-heading text-xs mb-2 ${
                  isFirst ? 'bg-amber-500 text-neutral-950' : isSecond ? 'bg-neutral-400 text-neutral-950' : 'bg-orange-600 text-white'
                }`}>
                  #{entry.rank}
                </div>

                {/* Avatar */}
                <div className="relative mb-2">
                  <img
                    src={entry.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'}
                    alt={entry.athleteName}
                    className={`w-16 h-16 rounded-full object-cover border-2 shadow-lg ${
                      isFirst ? 'border-amber-400 ring-4 ring-amber-500/20' : isSecond ? 'border-neutral-400' : 'border-orange-500'
                    }`}
                  />
                  {entry.currentStreakDays > 0 && (
                    <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center gap-0.5 border border-neutral-900 shadow">
                      <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                      {entry.currentStreakDays}д
                    </span>
                  )}
                </div>

                {/* Athlete Name & Tier */}
                <h4 className="font-extrabold text-white text-base truncate max-w-[180px]">
                  {entry.athleteName}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border mt-1 ${tier.color}`}>
                  {tier.text}
                </span>

                {/* Score */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 w-full flex items-center justify-around">
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">
                      {period === 'allTime' && exercise !== 'all' ? 'Рекорд 60с' : 'Чисті репи'}
                    </span>
                    <span className="text-xl font-extrabold text-amber-400 font-heading">
                      {entry.value}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Всього</span>
                    <span className="text-xs font-bold text-neutral-300 font-mono">
                      {entry.totalVerifiedReps}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Пошук атлета за імʼям або гаманцем..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between text-xs font-bold text-neutral-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="w-8 text-center">РАНГ</span>
            <span>АТЛЕТ FORGE</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            <span className="hidden sm:inline">СТРІК</span>
            <span>БАЛИ / РЕПИ</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs font-mono">Завантаження верифікованих даних ліги...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs font-mono">
            Поки немає користувачів
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {filteredList.map((entry) => {
              const tier = getTierLabel(entry.forgeTier);
              const isCurrentUser = data?.currentUserRank?.userId === entry.userId || data?.currentUserRank?.wallet === entry.wallet;

              return (
                <div
                  key={entry.userId || entry.wallet}
                  className={`p-3 sm:p-3.5 flex items-center justify-between transition-colors hover:bg-neutral-850/60 ${
                    isCurrentUser ? 'bg-amber-950/30 border-l-4 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-7 text-center font-extrabold font-heading text-xs sm:text-sm ${
                      entry.rank === 1 ? 'text-amber-400' : entry.rank === 2 ? 'text-neutral-300' : entry.rank === 3 ? 'text-orange-400' : 'text-neutral-500'
                    }`}>
                      #{entry.rank}
                    </span>

                    <img
                      src={entry.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces'}
                      alt={entry.athleteName}
                      className="w-9 h-9 rounded-full object-cover border border-neutral-700 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {entry.athleteName}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 text-[9px] rounded bg-amber-500 text-neutral-950 font-black">
                            ТИ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${tier.color}`}>
                          {tier.text}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 truncate hidden sm:inline">
                          {entry.wallet ? `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                    {/* Streak Badge */}
                    <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-950/40 px-2 py-1 rounded-lg border border-orange-700/40">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" />
                      <span>{entry.currentStreakDays} дн</span>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-extrabold text-amber-400 font-heading">
                        {entry.value}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500">
                        {entry.totalVerifiedReps} заг.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Athlete Floating Rank Footer */}
      {data?.currentUserRank && (
        <div className="rounded-xl bg-neutral-950/90 border border-amber-500/40 p-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs font-heading">
              #{data.currentUserRank.rank}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Ваш поточний рейтинг: {data.currentUserRank.athleteName}</span>
                <span className="text-neutral-400 font-normal">({data.currentUserRank.value} репів)</span>
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
                <span>Стрік: {data.currentUserRank.currentStreakDays} днів поспіль</span>
              </div>
            </div>
          </div>

          <span className="text-xs font-bold text-amber-400 font-mono">
            {getTierLabel(data.currentUserRank.forgeTier).text}
          </span>
        </div>
      )}
    </div>
  );
};
