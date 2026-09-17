import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  DailyQuest,
  WeeklyChallenge,
  RandomChallenge,
  ForgeScoreBreakdown,
  Discipline
} from '../types';
import { communityStore, REPUTATION_RANKS } from '../services/communityStore';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import {
  User,
  Target,
  Award,
  Dices,
  Flame,
  Zap,
  CheckCircle2,
  Trophy,
  Shield,
  Activity,
  Edit2,
  Calendar,
  Sparkles,
  BarChart3,
  Clock,
  ExternalLink
} from 'lucide-react';

const AVATAR_OPTIONS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces', label: 'Spartan Steel' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces', label: 'Bar Brawler' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces', label: 'Iron Berserk' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces', label: 'Street Acrobat' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces', label: 'Valkyrie Forge' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces', label: 'Cyber Lifter' }
];

interface ForgeProfileQuestsProps {
  onEarnXp?: (amount: number) => void;
  onNavigateToWorkout?: () => void;
  initialTab?: 'profile' | 'quests' | 'random' | 'score';
}

export const ForgeProfileQuests: React.FC<ForgeProfileQuestsProps> = ({ onEarnXp, onNavigateToWorkout, initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'quests' | 'random' | 'score'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [profile, setProfile] = useState<UserProfile>(communityStore.getUserProfile());
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<WeeklyChallenge[]>([]);
  const [forgeScore, setForgeScore] = useState<ForgeScoreBreakdown>(communityStore.getForgeScore());

  // Random Challenge state
  const [currentRandomChallenge, setCurrentRandomChallenge] = useState<RandomChallenge | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [acceptedRandomChallenge, setAcceptedRandomChallenge] = useState<boolean>(false);

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editDiscipline, setEditDiscipline] = useState<Discipline>(profile.discipline);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(profile.avatar);

  useEffect(() => {
    const update = () => {
      setProfile(communityStore.getUserProfile());
      setDailyQuests(communityStore.getDailyQuests());
      setWeeklyChallenges(communityStore.getWeeklyChallenges());
      setForgeScore(communityStore.getForgeScore());
    };
    update();
    const unsub = communityStore.subscribe(update);
    return () => unsub();
  }, []);

  const handleClaimDailyQuest = (id: string) => {
    const xp = communityStore.claimDailyQuest(id);
    if (xp > 0 && onEarnXp) {
      onEarnXp(xp);
      arnoVoice.speak(`Квест виконано! Отримано плюс ${xp} досвіду.`);
    }
  };

  const handleClaimWeeklyChallenge = (id: string) => {
    const xp = communityStore.claimWeeklyChallenge(id);
    if (xp > 0 && onEarnXp) {
      onEarnXp(xp);
    }
  };

  const handleRollRandomChallenge = () => {
    sound.playClick();
    setIsRolling(true);
    setAcceptedRandomChallenge(false);

    setTimeout(() => {
      const challenge = communityStore.getRandomChallenge();
      setCurrentRandomChallenge(challenge);
      setIsRolling(false);
      sound.playAnvilHit();
      arnoVoice.speak(`Твій випадковий челендж: ${challenge.title}! Рідкість ${challenge.rarity.toUpperCase()}.`);
    }, 450);
  };

  const handleAcceptRandomChallenge = () => {
    setAcceptedRandomChallenge(true);
    sound.playLevelUp();
    arnoVoice.speak(`Виклик прийнято! Час починати виконання.`);
  };

  const handleCompleteRandomChallenge = () => {
    if (!currentRandomChallenge) return;
    sound.playTrophy();
    if (onEarnXp) onEarnXp(currentRandomChallenge.xpReward);
    communityStore.addReputationPoints(25, 'Виконання випадкового челенджу');
    arnoVoice.speak(`Чудова робота! Випадковий челендж виконано, нагороду додано до твого арсеналу!`);
    setCurrentRandomChallenge(null);
    setAcceptedRandomChallenge(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    communityStore.updateProfile({
      username: editUsername.trim() || profile.username,
      bio: editBio.trim(),
      discipline: editDiscipline,
      avatar: selectedAvatarUrl
    });
    setShowEditModal(false);
    arnoVoice.speak(`Профіль успішно оновлено!`);
  };

  const rarityStyles: Record<string, { bg: string; text: string; border: string }> = {
    common: { bg: 'bg-neutral-800', text: 'text-neutral-300', border: 'border-neutral-700' },
    rare: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
    epic: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
    legendary: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50' }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-xl">
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-neutral-950 shadow-md">
                LVL {profile.level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-extrabold text-white font-heading">
                  {profile.username}
                </h1>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {profile.reputationRank}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Напрямок: <strong className="text-amber-400 capitalize">{profile.discipline}</strong> • Гільдія: <strong className="text-white">{profile.guildName || 'Вільний атлет'}</strong>
              </p>
              <div className="flex items-center gap-4 text-xs font-bold pt-1">
                <span className="text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> {profile.streakDays} днів стрік
                </span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Forge Score: {forgeScore.total} / 1000
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowEditModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Редагувати профіль</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-neutral-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('profile');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Профіль Атлета</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('quests');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quests'
                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Daily Quests & Weekly</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('random');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'random'
                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Random Challenge 🎲</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('score');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'score'
                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Forge Score ⚒️ ({forgeScore.total})</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: ATHLETE PROFILE ==================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="md:col-span-2 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Про себе:</span>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                {profile.bio}
              </p>
            </div>

            {/* Core Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Рівень</span>
                <span className="text-xl font-extrabold text-white font-heading">{profile.level}</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Репутація</span>
                <span className="text-xl font-extrabold text-amber-400 font-heading">{profile.reputationPoints} Rep</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Днів поспіль</span>
                <span className="text-xl font-extrabold text-orange-400 font-heading">{profile.streakDays} 🔥</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Челенджі</span>
                <span className="text-xl font-extrabold text-emerald-400 font-heading">{profile.completedChallengesCount} 🏆</span>
              </div>
            </div>

            {/* Reputation Ranks Ladder */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                СХОДИНКИ РЕПУТАЦІЇ У КУЗНІ
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REPUTATION_RANKS.map((r) => {
                  const isCurrent = r.rank === profile.reputationRank;
                  return (
                    <div
                      key={r.rank}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'bg-neutral-950/60 border-neutral-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.badge}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{r.title}</div>
                          <div className="text-[10px] text-neutral-400">{r.minPoints}+ XP</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Side Card: Guild & Training Direction */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                ТВОЯ ГІЛЬДІЯ
              </h3>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
                <div className="text-3xl">🛡️</div>
                <h4 className="text-base font-extrabold text-white">{profile.guildName || 'Вільний коваль'}</h4>
                <p className="text-xs text-neutral-400">
                  {profile.guildName
                    ? 'Твій внесок допомагає гільдії перемагати у тижневому заліку!'
                    : 'Обери свою гільдію у розділі Спільноти.'}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                ШВИДКИЙ СТАРТ ТРЕНУВАННЯ
              </h3>
              <p className="text-xs text-neutral-400">
                Запусти камеру або відкрий тренувальну програму, щоб підняти сьогоднішній Forge Score!
              </p>
              {onNavigateToWorkout && (
                <button
                  onClick={onNavigateToWorkout}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer font-heading"
                >
                  ПЕРЕЙТИ ДО ТРЕНУВАНЬ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: DAILY & WEEKLY QUESTS ==================== */}
      {activeTab === 'quests' && (
        <div className="space-y-8">
          {/* Daily Quests Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" />
                  ЩОДЕННІ ЗАВДАННЯ (DAILY QUESTS)
                </h2>
                <p className="text-xs text-neutral-400">
                  Оновлюються кожні 24 години. За виконання отримуй чистий XP та репутацію!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  className={`rounded-2xl border p-5 space-y-3 transition-all ${
                    quest.isClaimed
                      ? 'bg-neutral-950/60 border-neutral-800 opacity-60'
                      : quest.isCompleted
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white font-heading">
                        {quest.title}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {quest.description}
                      </p>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shrink-0">
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Прогрес</span>
                      <span>{quest.progress} / {quest.target} {quest.unit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="pt-1 flex justify-end">
                    {quest.isClaimed ? (
                      <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                        Винагороду отримано
                      </span>
                    ) : quest.isCompleted ? (
                      <button
                        onClick={() => handleClaimDailyQuest(quest.id)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all cursor-pointer font-heading"
                      >
                        ЗАБРАТИ НАГОРОДУ
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500">У процесі виконання...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Challenges Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                ЩОТИЖНЕВІ ЧЕЛЕНДЖІ (WEEKLY CHALLENGES)
              </h2>
              <p className="text-xs text-neutral-400">
                Великі випробування для справжніх титанів з унікальними титулами та нагородами.
              </p>
            </div>

            <div className="space-y-4">
              {weeklyChallenges.map((wc) => (
                <div
                  key={wc.id}
                  className={`rounded-3xl border p-6 space-y-4 transition-all ${
                    wc.isClaimed
                      ? 'bg-neutral-950/60 border-neutral-800 opacity-60'
                      : wc.isCompleted
                      ? 'bg-yellow-950/20 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                      : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                          {wc.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                          {wc.daysRemaining} дн. залишилося
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        {wc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                        {wc.badgeReward}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        +{wc.xpReward} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>Прогрес</span>
                      <span>{wc.progress} / {wc.target} {wc.unit}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (wc.progress / wc.target) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    {wc.isClaimed ? (
                      <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                        Нагороду та титул нараховано
                      </span>
                    ) : wc.isCompleted ? (
                      <button
                        onClick={() => handleClaimWeeklyChallenge(wc.id)}
                        className="px-6 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-extrabold text-xs transition-all cursor-pointer font-heading shadow-md"
                      >
                        ЗАБРАТИ ТИТУЛ & XP
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-500">Виконуйте завдання протягом тижня</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: RANDOM CHALLENGE ==================== */}
      {activeTab === 'random' && (
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-8 space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-4xl shadow-lg">
              🎲
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                RANDOM CHALLENGE (КУЗНЯ НЕВІДОМОГО)
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                Кинь виклик долі! Випадковий челендж випробує твоє тіло з різною рідкістю: Common, Rare, Epic або Legendary.
              </p>
            </div>

            <button
              onClick={handleRollRandomChallenge}
              disabled={isRolling}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-base sm:text-lg shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer font-heading active:scale-95 disabled:opacity-50"
            >
              {isRolling ? 'ГЕНЕРУЄМО ВИКЛИК...' : '🎲 ЗГЕНЕРУВАТИ ВИПАДКОВИЙ ЧЕЛЕНДЖ'}
            </button>

            {/* Generated Challenge Card */}
            {currentRandomChallenge && (
              <div
                className={`p-6 rounded-3xl border mt-6 space-y-4 text-left animate-in fade-in duration-200 ${
                  rarityStyles[currentRandomChallenge.rarity]?.border || 'border-amber-500'
                } bg-neutral-950`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                      rarityStyles[currentRandomChallenge.rarity]?.bg
                    } ${rarityStyles[currentRandomChallenge.rarity]?.text} ${
                      rarityStyles[currentRandomChallenge.rarity]?.border
                    }`}
                  >
                    {currentRandomChallenge.rarity.toUpperCase()} CHALLENGE
                  </span>

                  <span className="text-sm font-extrabold text-amber-400 font-heading">
                    +{currentRandomChallenge.xpReward} XP
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-heading">
                    {currentRandomChallenge.title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {currentRandomChallenge.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-300 pt-2 border-t border-neutral-900">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    Час: {currentRandomChallenge.timeLimitMinutes} хв
                  </span>
                  <span>
                    Ціль: <strong>{currentRandomChallenge.targetReps} репів</strong>
                  </span>
                </div>

                {/* Challenge Action Button */}
                <div className="pt-2">
                  {!acceptedRandomChallenge ? (
                    <button
                      onClick={handleAcceptRandomChallenge}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all cursor-pointer font-heading"
                    >
                      ПРИЙНЯТИ ВИКЛИК!
                    </button>
                  ) : (
                    <button
                      onClick={handleCompleteRandomChallenge}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all cursor-pointer font-heading shadow-lg"
                    >
                      ✅ ВИКОНАНО! ЗАБРАТИ {currentRandomChallenge.xpReward} XP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: FORGE SCORE ==================== */}
      {activeTab === 'score' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Загальний показник спортивної активності
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading mt-1">
                  FORGE SCORE: {forgeScore.total} / 1000
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Обчислюється на основі 5 стовпів: тренування, дисципліна, випробування, знання та внесок у спільноту.
                </p>
              </div>

              <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex flex-col items-center justify-center text-amber-400 shadow-inner shrink-0">
                <span className="text-2xl font-black font-heading">{Math.round((forgeScore.total / 1000) * 100)}%</span>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Атлет</span>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-4">
              {/* Training */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    🏋️ Training (Тренувальний обсяг)
                  </span>
                  <span className="font-mono text-neutral-400">{forgeScore.training} / 250</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${(forgeScore.training / 250) * 100}%` }}
                  />
                </div>
              </div>

              {/* Consistency */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    ⏱️ Consistency (Регулярність & Стрік)
                  </span>
                  <span className="font-mono text-neutral-400">{forgeScore.consistency} / 200</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(forgeScore.consistency / 200) * 100}%` }}
                  />
                </div>
              </div>

              {/* Challenges */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    🏆 Challenges (Виконані виклики та квести)
                  </span>
                  <span className="font-mono text-neutral-400">{forgeScore.challenges} / 200</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${(forgeScore.challenges / 200) * 100}%` }}
                  />
                </div>
              </div>

              {/* Knowledge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    📚 Knowledge (Wiki та Myth or Fact)
                  </span>
                  <span className="font-mono text-neutral-400">{forgeScore.knowledge} / 150</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${(forgeScore.knowledge / 150) * 100}%` }}
                  />
                </div>
              </div>

              {/* Community */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    🧠 Community (Репутація та відповіді)
                  </span>
                  <span className="font-mono text-neutral-400">{forgeScore.community} / 200</span>
                </div>
                <div className="h-3 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${(forgeScore.community / 200) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT PROFILE MODAL ==================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                НАЛАШТУВАННЯ ПРОФІЛЮ АТЛЕТА
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-2">Обери аватар:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      type="button"
                      key={av.id}
                      onClick={() => setSelectedAvatarUrl(av.url)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatarUrl === av.url
                          ? 'border-amber-500 scale-105 shadow-md'
                          : 'border-neutral-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Імʼя атлета (Username)</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Спортивний напрямок</label>
                <select
                  value={editDiscipline}
                  onChange={(e) => setEditDiscipline(e.target.value as Discipline)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  <option value="hybrid">Гібрид (Залізо + Калістеніка)</option>
                  <option value="calisthenics">Калістеніка (Власна вага)</option>
                  <option value="bodybuilding">Бодибілдинг (Важка сталь)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Про себе (Bio)</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Твої тренувальні цілі, поточні рекорди..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-extrabold text-xs sm:text-sm hover:bg-amber-400 transition-all cursor-pointer font-heading"
                >
                  ЗБЕРЕГТИ ЗМІНИ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
