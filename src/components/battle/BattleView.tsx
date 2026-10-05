import { Avatar } from '../../ui/Avatar';
import { PlayerSearch } from './PlayerSearch';
import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  RotateCcw, 
  Share2, 
  Trophy, 
  RotateCw,
  Sparkles, 
  Check, 
  Bot,
  MessageSquare,
  Volume2,
  Skull,
  Flame,
  Shield,
  Zap,
  ArrowRight,
  Activity
} from 'lucide-react';
import { battleStore, BattlePhase } from '../../services/battleStore';
import { EXERCISES } from '../../data/exercisesData';
import { ExerciseId } from '../../types';
import { CameraEngine } from './CameraEngine';
import { BattleInGameChat } from './BattleInGameChat';
import { BattleVoiceOverlay } from './BattleVoiceOverlay';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useI18n } from '../../services/i18n';
import { soundEngine } from '../../services/soundEngine';
import { CompetitionView } from './CompetitionView';
import { SolanaPlayerDonation } from '../common/SolanaPlayerDonation';
import { socketClient } from '../../services/socketClient';

export interface BattleViewProps {
  initialExerciseId?: ExerciseId;
  onNavigateToLeaderboard: () => void;
  onNavigateToHome: () => void;
}

export type BattleMode = 'pvp' | 'competition';

export const BattleView: React.FC<BattleViewProps> = ({
  initialExerciseId,
  onNavigateToLeaderboard,
  onNavigateToHome
}) => {
  const { t, lang } = useI18n();
  const [battleMode, setBattleMode] = useState<BattleMode>('pvp');
  const [phase, setPhase] = useState<BattlePhase>(battleStore.phase);
  const [match, setMatch] = useState(battleStore.currentMatch);
  const [exerciseId, setExerciseId] = useState<ExerciseId>(initialExerciseId || battleStore.exerciseId);
  const [tugValue, setTugValue] = useState<number>(battleStore.tugOfWarValue);
  const [countdownNum, setCountdownNum] = useState<number>(battleStore.countdownNumber);
  const [mmTimer, setMmTimer] = useState<number>(battleStore.matchmakingTimer);
  const [battleDuration, setBattleDuration] = useState<number>(battleStore.durationSeconds);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState<boolean>(false);
  const [battleInvite, setBattleInvite] = useState<any>(null);

  // In-Battle Chat & Voice State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatNotifications, setChatNotifications] = useState<string[]>([]);

  const [competitionView, setCompetitionView] = useState<'list' | 'active' | 'result'>('list');

  useEffect(() => {
    const offInvite = socketClient.on('battle_invite', (data) => setBattleInvite(data));
    const offExpired = socketClient.on('battle_invite_expired', (data) => {
      setBattleInvite((current:any) => current?.inviteId === data.inviteId ? null : current);
    });
    return () => { offInvite(); offExpired(); };
  }, []);

  useEffect(() => {
    if (initialExerciseId) {
      battleStore.selectExercise(initialExerciseId);
      setExerciseId(initialExerciseId);
    }

    return battleStore.subscribe(() => {
      setPhase(battleStore.phase);
      setMatch(battleStore.currentMatch ? { ...battleStore.currentMatch } : null);
      setExerciseId(battleStore.exerciseId);
      setTugValue(battleStore.tugOfWarValue);
      setCountdownNum(battleStore.countdownNumber);
      setMmTimer(battleStore.matchmakingTimer);
      setBattleDuration(battleStore.durationSeconds);
    });
  }, [initialExerciseId]);

  const currentExercise = EXERCISES.find((e) => e.id === exerciseId) || EXERCISES[0];

  // Rep counted during battle
  const handleCameraRep = async (repCount: number, rom: number, accuracy: number, errorType?: string) => {
    if (match && phase === 'in_battle') {
      battleStore.submitCameraRep(rom, accuracy, errorType);
      setChatNotifications((prev) => [...prev, `⚡ Повтор ${repCount} відправлено на перевірку (${accuracy}%)`]);
    }
  };

  const handleShareResult = async () => {
    const reps = match?.playerReps || 0;
    const shareText = `Мій результат у Forge Battle: ${reps} повторів ${currentExercise.name}! Спробуй перевершити мене у ${match?.durationSeconds || battleDuration}-секундній дуелі! ⚔️`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ForgeMuscle Battle',
          text: shareText,
          url: window.location.href
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText?.(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const activeMatchId = match?.id || 'pvp_match';
  const opponentNick = match?.opponent.nick || (lang === 'en' ? 'Opponent' : 'Суперник');
  const opponentAvatar = match?.opponent.avatar || '⚡';

  return (
    <div className="flex flex-col gap-5 pb-24 max-w-4xl mx-auto w-full px-4 pt-3">
      {battleInvite && (
        <div className="fixed inset-x-4 top-4 z-[60] mx-auto max-w-md rounded-2xl border border-[var(--accent)] bg-[var(--bg-card)] p-4 shadow-2xl">
          <div className="font-bold text-[var(--text-primary)]">⚔️ {battleInvite.from?.nick || (lang === 'en' ? 'Player' : 'Гравець')} викликає тебе на дуель</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">{battleInvite.exerciseId} · {lang === 'en' ? `${battleInvite.durationSeconds || 60}s battle · invite expires in 30s` : `бій ${battleInvite.durationSeconds || 60}с · запрошення діє 30 секунд`}</div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" className="flex-1" onClick={() => { socketClient.send('battle_invite_accept',{inviteId:battleInvite.inviteId}); setBattleInvite(null); }}>{t.common.confirm}</Button>
            <Button variant="outline" className="flex-1" onClick={() => { socketClient.send('battle_invite_decline',{inviteId:battleInvite.inviteId}); setBattleInvite(null); }}>{t.common.cancel}</Button>
          </div>
        </div>
      )}
      {battleMode === 'pvp' && (<>
      {/* 1. IDLE SCREEN: Mode Selection & Exercise Picker */}
      {phase === 'idle' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
                <Swords className="text-[var(--accent)]" />
                {t.battle.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t.battle.subtitle}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChallengeModalOpen(true)}
            >
              <Share2 size={14} className="mr-1.5" />
              {t.battle.callFriend}
            </Button>
          </div>

          {/* Mode Switcher: 1v1 PvP vs PvP */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setBattleMode('pvp')}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                battleMode === 'pvp'
                  ? 'bg-[var(--bg-subtle)] border-[var(--accent)] shadow-[0_0_20px_rgba(255,107,0,0.25)]'
                  : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Swords size={20} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">
                    {t.battle.modePvp}
                  </h4>
                  <span className="text-[11px] text-[var(--text-secondary)]">Змагання 1v1 наживо</span>
                </div>
              </div>
              <Badge variant={battleMode === 'pvp' ? 'accent' : 'neutral'} size="sm">
                {battleMode === 'pvp' ? 'Активний режим' : 'Вибрати'}
              </Badge>
            </div>

            <div
              onClick={() => { setBattleMode('competition'); setCompetitionView('list'); }}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                (battleMode as BattleMode) === 'competition' ? 'bg-[var(--accent)]/10 border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]' : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]"><Trophy size={20} /></div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">{t.battle.modeCompetition}</h4>
                  <span className="text-[11px] text-[var(--text-secondary)]">{t.battle.competitionSubtitle}</span>
                </div>
              </div>
              <Badge variant={(battleMode as BattleMode) === 'competition' ? 'accent' : 'neutral'} size="sm">{(battleMode as BattleMode) === 'competition' ? t.battle.competitionTitle : t.battle.competitionJoin}</Badge>
            </div>
          </div>

          {/* Battle Duration */}
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-heading font-bold text-sm text-[var(--text-primary)]">
                  {lang === 'en' ? 'Battle duration' : 'Тривалість бою'}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {lang === 'en' ? 'Choose how long the live battle will last.' : 'Вибери, скільки триватиме онлайн-бій.'}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[30,60,90,120].map(seconds => (
                  <button key={seconds} type="button" onClick={() => { setBattleDuration(seconds); battleStore.setDuration(seconds); }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${battleDuration === seconds ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]' : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]'}`}>
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Exercise Picker Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXERCISES.filter((e) => e.supportedByCamera).map((ex) => {
              const isSelected = ex.id === exerciseId;
              return (
                <div
                  key={ex.id}
                  onClick={() => {
                    setExerciseId(ex.id);
                    battleStore.selectExercise(ex.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[var(--bg-subtle)] border-[var(--accent)] shadow-[0_0_20px_var(--accent-glow)]'
                      : 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-heading font-bold text-base text-[var(--text-primary)]">{ex.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ex.muscleTarget}</p>
                    </div>
                    {isSelected && (
                      <Badge variant="accent" size="sm">Обрано</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <span>{t.battle.thresholdRom}</span>
                    <span className="font-bold text-[var(--accent)]">60 сек</span>
                  </div>
                </div>
              );
            })}
          </div>

          <PlayerSearch exerciseId={exerciseId} durationSeconds={battleDuration} />

          {/* Action CTA */}
          <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)] mb-0.5">
                {t.battle.calibration}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Перед початком ми перевіримо освітлення, видимість плечей та ракурс.
              </p>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={() => {
                battleStore.startCalibration(exerciseId);
              }}
              className="w-full sm:w-auto font-bold px-8 shadow-md"
            >
              {`${t.battle.startCalibration} →`}
            </Button>
          </Card>
        </div>
      )}

      {/* 2. CALIBRATION SCREEN */}
      {phase === 'calibrating' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-[var(--text-primary)]">
              {t.battle.calibration}: {currentExercise.name}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => battleStore.exitToIdle()}>
              Назад
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <CameraEngine
                exerciseId={exerciseId}
                isActive={true}
              />
            </div>

            <div className="flex flex-col justify-between gap-4">
              <Card variant="default" padding="md" className="space-y-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  Чеклист перед боєм
                </h4>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold">1.</span>
                    <span>Стань повністю в кадр: плечі та торс мають бути чітко видимі.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold">2.</span>
                    <span>Уникай яскравого світла прямо позаду себе (контрове світло).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] font-bold">3.</span>
                    <span>Постав телефон на висоті 50–90 см від підлоги під невеликим кутом.</span>
                  </li>
                </ul>
              </Card>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => battleStore.startMatchmaking()}
                className="font-bold py-4 shadow-md"
              >
                {t.battle.allReadySearch} →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MATCHMAKING SCREEN */}
      {phase === 'matchmaking' && (
        <div className="min-h-[380px] flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="relative w-32 h-32 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border border-[var(--accent)]/40" />
            <div className="w-16 h-16 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] shadow-lg shadow-[var(--accent)]/20">
              <Swords size={28} />
            </div>
          </div>

          <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">
            {t.battle.searchingOpponent}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
            Вправа: {currentExercise.name} • {battleDuration}-секундний формат
          </p>

          <div className="flex items-center gap-2 bg-[var(--bg-subtle)] px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] mb-6">
            <span>Таймаут пошуку:</span>
            <span className="text-[var(--accent)] font-bold text-sm">{mmTimer}с</span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => battleStore.exitToIdle()}>
            {t.battle.cancelSearch}
          </Button>
        </div>
      )}

      {/* 3b. MATCHMAKING TIMEOUT */}
      {phase === 'matchmaking_timeout' && (
        <div className="min-h-[380px] flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
            <Bot size={32} />
          </div>

          <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-1">
            {t.battle.timeoutTitle}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6">
            {t.battle.timeoutDesc}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => battleStore.chooseBotSparring()}
              className="font-bold shadow-md"
            >
              <Bot size={18} className="mr-2" />
              {t.battle.sparWithBot}
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => battleStore.startMatchmaking()}
            >
              <RotateCcw size={18} className="mr-2" />
              {t.battle.retrySearch}
            </Button>
          </div>
        </div>
      )}

      {/* 4. COUNTDOWN */}
      {phase === 'countdown' && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#0B0D11] border-2 border-[var(--accent)]/50">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--accent)] mb-4">
            {lang === 'en' ? 'Get ready!' : 'Приготуйся!'}
          </div>

          <div className="font-heading text-8xl sm:text-9xl font-black text-white drop-shadow-[0_0_35px_rgba(255,107,0,0.5)] animate-pulse">
            {countdownNum === 0 ? (lang === 'en' ? 'START!' : 'СТАРТ!') : countdownNum}
          </div>

          <div className="text-xs text-[var(--text-secondary)] mt-6 max-w-xs">
            {lang === 'en' ? `Battle: ${match?.durationSeconds || battleDuration}s` : `Бій: ${match?.durationSeconds || battleDuration}с`}
          </div>

          <div className="text-xs text-[var(--text-secondary)] mt-2 max-w-xs">
            {lang === 'en' ? 'Opponent: ' : 'Суперник: '}<span className="text-white font-bold">{match?.opponent.nick}</span> ({match?.opponent.title})
          </div>
        </div>
      )}

      {/* 5. IN BATTLE: 1v1 PvP or PvP FIGHT */}
      {phase === 'in_battle' && (
        <div className="flex flex-col gap-4">
          {/* Top Status Bar */}
          <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-subtle)] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[var(--accent)] flex items-center gap-1">
                ТИ ({match?.playerReps || 0})
              </span>
              <span className="text-rose-400 font-mono text-sm bg-black/40 px-3 py-1 rounded-full border border-white/10">
                ⏱ {match?.remainingSeconds ?? battleDuration}с
              </span>
              <span className="text-amber-400">
                {opponentNick} {`(${match?.opponentReps || 0})`}
              </span>
            </div>

            {battleMode === 'pvp' && (
              <div className="relative w-full h-3 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10 -translate-x-1/2" />
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] via-amber-400 to-rose-400 transition-all duration-300 rounded-full"
                  style={{
                    width: '50%',
                    marginLeft: `${Math.max(0, Math.min(50, 25 + (tugValue / 2)))}%`
                  }}
                />
              </div>
            )}
          </div>

          {/* In-Battle Voice Overlay */}
          <BattleVoiceOverlay
            matchId={activeMatchId}
            opponentNick={opponentNick}
            opponentAvatar={opponentAvatar}
          />

          {/* Arena Display: Camera + PvP Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Athlete AI Camera Stream */}
            <div className="w-full">
              <div className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                <span>Камера атлета (MediaPipe Pose)</span>
                <span className="text-[var(--accent)]">{currentExercise.name}</span>
              </div>
              <CameraEngine
                exerciseId={exerciseId}
                isActive={true}
                onRepCounted={handleCameraRep}
              />
            </div>

            {/* Right Panel: PvP or PvP Stats */}
            <div className="w-full flex flex-col justify-between gap-3">
              {(
                <div className="flex flex-col gap-3 flex-1">
                  <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-subtle)] text-center flex flex-col items-center justify-center flex-1 shadow-lg">
                    <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">
                      {t.battle.yourReps}
                    </span>
                    <span className="font-heading text-6xl sm:text-7xl font-black text-[var(--accent)] leading-none my-1">
                      {match?.playerReps || 0}
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      {t.battle.accuracy}: {match?.playerAccuracy || 100}%
                    </span>
                  </div>

                  <div className="bg-[var(--bg-subtle)] p-3 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar avatar={opponentAvatar} size="sm" />
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{opponentNick}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">1v1 Дуель</div>
                      </div>
                    </div>
                    <div className="font-heading font-black text-2xl text-amber-400">
                      {match?.opponentReps || 0}
                    </div>
                  </div>

                  {match && !match.opponent.isBot && (
                    <SolanaPlayerDonation battleId={match.id} targetUserId={match.opponent.id} targetNick={opponentNick} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* In-Battle Chat Drawer Trigger & Panel */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsChatOpen((o) => !o)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-primary)] transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-[var(--accent)]" />
                <span>{isChatOpen ? 'Приховати чат бою' : 'Відкрити чат бою під час поєдинку'}</span>
              </div>
              <Badge variant="accent" size="sm">
                {chatNotifications.length} подій
              </Badge>
            </button>

            {isChatOpen && (
              <BattleInGameChat
                matchId={activeMatchId}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                systemNotifications={chatNotifications}
              />
            )}
          </div>
        </div>
      )}

      {/* 6. BATTLE RESULT SCREEN */}
      {phase === 'finished' && (
        <div className="flex flex-col gap-5 max-w-xl mx-auto w-full">
          <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 text-center shadow-2xl">
            <div className="inline-flex p-3 rounded-full bg-black/40 border border-[var(--border-subtle)] mb-3">
              {match?.winner === 'player' ? (
                <Trophy size={40} className="text-[var(--crown-gold)]" />
              ) : (
                <Skull size={40} className="text-rose-400" />
              )}
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-black text-[var(--text-primary)] uppercase tracking-tight">
              {match?.winner === 'player'
                ? t.battle.victory
                : t.battle.defeat}
            </h2>

            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-5">
              {`Вправа: ${currentExercise.name} • ${match?.durationSeconds || battleDuration} секунд`}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-2xl border bg-[var(--accent)]/10 border-[var(--accent)]">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Ти</div>
                <div className="font-heading text-4xl font-extrabold text-[var(--accent)]">
                  {match?.playerReps || 0}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-1">повторів</div>
              </div>

              <div className="p-4 rounded-2xl border bg-[var(--bg-subtle)] border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-1">{opponentNick}</div>
                <div className="font-heading text-4xl font-extrabold text-amber-400">
                  {match?.opponentReps || 0}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-1">повторів</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => {
                  battleStore.startMatchmaking();
                }}
                className="font-bold shadow-md"
              >
                <RotateCcw size={16} className="mr-2" />
                {t.battle.rematch}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleShareResult}
              >
                <Share2 size={16} className="mr-2" />
                {copiedLink ? t.battle.copied : t.battle.share}
              </Button>
            </div>
          </div>
        </div>
      )}
      </>)}
      {battleMode === 'competition' && (
        <CompetitionView
          exerciseId={exerciseId}
          view={competitionView}
          onViewChange={setCompetitionView}
          onBack={() => setBattleMode('pvp')}
        />
      )}
    </div>
  );
};
