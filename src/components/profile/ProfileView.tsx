import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Flame, 
  Trophy, 
  Award, 
  Sparkles,
  Check, 
  Lock, 
  ShieldCheck,
  LogIn,
  UserCheck
} from 'lucide-react';
import { authStore } from '../../services/authStore';
import { forgeGameStore } from '../../services/forgeGameStore';
import { TITLES_LIST, EXERCISES } from '../../data/exercisesData';
import { Quest } from '../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import { SettingsModal } from '../settings/SettingsModal';
import { useI18n } from '../../services/i18n';
import { SolanaWalletCard } from '../common/SolanaWalletCard';
import { SolanaCheckout } from '../common/SolanaCheckout';
import { SolanaDonation } from '../common/SolanaDonation';
import { Avatar } from '../../ui/Avatar';

export const ProfileView: React.FC = () => {
  const { t } = useI18n();
  const [user, setUser] = useState(authStore.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.getIsAuthenticated());
  const [progress, setProgress] = useState(forgeGameStore.getProgress());
  const [quests, setQuests] = useState<Quest[]>(forgeGameStore.getQuests());
  const [activeTab, setActiveTab] = useState<'quests' | 'titles' | 'stats'>('quests');
  const [questSubTab, setQuestSubTab] = useState<'starter' | 'daily' | 'weekly'>('daily');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [claimRewardToast, setClaimRewardToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = authStore.subscribe(() => {
      setUser(authStore.getUser());
      setIsAuthenticated(authStore.getIsAuthenticated());
    });
    const unsubGame = forgeGameStore.subscribe(() => {
      setProgress({ ...forgeGameStore.getProgress() });
      setQuests([...forgeGameStore.getQuests()]);
    });
    return () => {
      unsubAuth();
      unsubGame();
    };
  }, []);

  const levelInfo = forgeGameStore.getLevelProgress();
  const activeTitle = forgeGameStore.getActiveTitle();

  const handleClaim = (questId: string) => {
    const res = forgeGameStore.claimQuestReward(questId);
    if (res) {
      setClaimRewardToast(`Отримано +${res.xpReward} XP!`);
      setTimeout(() => setClaimRewardToast(null), 2500);
    }
  };

  const handleSelectActiveTitle = (titleId: string) => {
    forgeGameStore.setActiveTitle(titleId);
  };

  const filteredQuests = quests.filter((q) => q.type === questSubTab);
  const totalMatches = progress.stats.totalWins + progress.stats.totalLosses;
  const winRate = totalMatches > 0 ? Math.round((progress.stats.totalWins / totalMatches) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 pb-24 max-w-4xl mx-auto w-full px-4 pt-3">
      {/* Profile Header Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#181D26] via-[#12161F] to-[#0B0D11] border border-[var(--border-subtle)] p-5 sm:p-6 overflow-hidden shadow-2xl">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Налаштування"
        >
          <SettingsIcon size={18} />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#0B0D11] border-2 border-[var(--accent)] flex items-center justify-center text-4xl shadow-xl">
              <Avatar avatar={user.avatar} size="xl" alt={user.nick} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white font-heading font-black text-xs px-2 py-0.5 rounded-lg shadow-md">
              LVL {progress.level}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="font-heading font-bold text-xl sm:text-2xl text-white">
                  {user.nick}
                </h2>
                {isAuthenticated && (
                  <Badge variant="success" size="sm">
                    <UserCheck size={11} className="mr-1" /> Акаунт верифіковано
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                <Badge variant="accent" size="sm" className="font-semibold">
                  {activeTitle.icon} {activeTitle.name}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Flame size={13} className="text-amber-400" />
                  {progress.stats.streakDays} {t.profile.streak}
                </span>
              </div>
            </div>

            <div className="w-full max-w-md pt-1">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span className="font-medium text-slate-300">
                  {progress.xp} {t.profile.totalXp}
                </span>
                <span>
                  {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP (до LVL {progress.level + 1})
                </span>
              </div>
              <ProgressBar value={levelInfo.percent} height="md" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/5 text-center">
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">{t.profile.wins}</div>
            <div className="font-heading text-xl sm:text-2xl font-bold text-[var(--accent)] mt-0.5">
              {progress.stats.totalWins}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">{t.profile.winrate}</div>
            <div className="font-heading text-xl sm:text-2xl font-bold text-white mt-0.5">
              {winRate}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">{t.profile.reps}</div>
            <div className="font-heading text-xl sm:text-2xl font-bold text-white mt-0.5">
              {progress.stats.totalReps}
            </div>
          </div>
        </div>
      </div>

      <SolanaWalletCard />

      <SolanaCheckout />

      <SolanaDonation />

      {claimRewardToast && (
        <div className="bg-[var(--accent)] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg text-center text-xs animate-in fade-in">
          {claimRewardToast}
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)]">
        {[
          { id: 'quests', label: t.profile.questsTab, icon: <Award size={15} /> },
          { id: 'titles', label: t.profile.titlesTab, icon: <Sparkles size={15} /> },
          { id: 'stats', label: t.profile.statsTab, icon: <Trophy size={15} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--accent)] text-white shadow-md font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. QUESTS TAB */}
      {activeTab === 'quests' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {[
              { id: 'starter', label: 'Стартові (Шлях)' },
              { id: 'daily', label: 'Щоденні' },
              { id: 'weekly', label: 'Тижневі' }
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setQuestSubTab(sub.id as typeof questSubTab)}
                className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  questSubTab === sub.id
                    ? 'bg-[var(--bg-subtle)] text-[var(--accent)] border-[var(--accent)]/40 font-bold'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredQuests.map((quest) => {
              const isCompleted = quest.completed;
              const isClaimed = quest.claimed;

              return (
                <Card
                  key={quest.id}
                  variant="default"
                  padding="md"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[var(--text-primary)]">
                        {quest.title}
                      </span>
                      <Badge variant="accent" size="sm">
                        +{quest.rewardXp} XP
                      </Badge>
                      {quest.rewardTitleId && (
                        <Badge variant="neutral" size="sm">
                          Титул
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">{quest.desc}</p>
                    
                    <div className="pt-1 max-w-sm">
                      <ProgressBar
                        value={quest.current}
                        max={quest.goal}
                        height="sm"
                        showLabel
                      />
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isClaimed ? (
                      <Badge variant="neutral">
                        <Check size={12} className="mr-1 text-[var(--accent)]" /> {t.profile.claimed}
                      </Badge>
                    ) : isCompleted ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleClaim(quest.id)}
                        className="font-bold shadow-md animate-pulse"
                      >
                        {t.profile.claimReward}
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)] font-medium">
                        {t.profile.inProgress}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. TITLES TAB */}
      {activeTab === 'titles' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
                {t.profile.titlesTab}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Отримай титули за досягнення та обери активний для таблиці лідерів
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TITLES_LIST.map((title) => {
              const isUnlocked = progress.unlockedTitleIds.includes(title.id);
              const isActive = progress.activeTitleId === title.id;

              return (
                <Card
                  key={title.id}
                  variant={isActive ? 'accent' : isUnlocked ? 'default' : 'subtle'}
                  padding="md"
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{title.icon}</span>
                    <div>
                      <div className="font-heading font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                        <span>«{title.name}»</span>
                        {isActive && <Badge variant="accent" size="sm">{t.profile.activeTitle}</Badge>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{title.condition}</p>
                    </div>
                  </div>

                  <div>
                    {isActive ? (
                      <Badge variant="accent">
                        <Check size={12} className="mr-1" /> {t.profile.activeTitle}
                      </Badge>
                    ) : isUnlocked ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSelectActiveTitle(title.id)}
                      >
                        {t.profile.selectTitle}
                      </Button>
                    ) : (
                      <Badge variant="neutral" className="opacity-60">
                        <Lock size={12} className="mr-1" /> Заблоковано
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. STATS TAB */}
      {activeTab === 'stats' && (
        <div className="flex flex-col gap-4">
          <h3 className="font-heading font-bold text-base text-[var(--text-primary)]">
            {t.profile.repsByExercise}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXERCISES.map((ex) => {
              const reps = progress.stats.exerciseReps[ex.id] || 0;
              return (
                <Card key={ex.id} variant="default" padding="md" className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">{ex.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{ex.muscleTarget}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-heading font-black text-2xl text-[var(--accent)]">
                      {reps}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]">повторів сумарно</div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card variant="subtle" padding="md" className="space-y-2 text-xs text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--accent)]" />
              Чесна статистика Forge
            </div>
            <p className="leading-relaxed">
              Кожен зарахований повтор пройшов верифікацію амплітуди понад 85% ROM та захищений серверним античит-підписом.
            </p>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
