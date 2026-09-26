import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Swords, 
  Copy, 
  Check, 
  ShieldCheck, 
  Flame, 
  X, 
  Share2, 
  Play, 
  Sparkles,
  Award
} from 'lucide-react';
import { sound } from '../services/soundEngine';

interface ChallengeInviteRecord {
  code: string;
  creatorWallet: string;
  creatorName: string;
  exercise: string;
  creatorReps: number;
  proofHash?: string;
  createdAt: number;
  expiresAt: number;
  acceptedBy?: {
    athleteName: string;
    acceptedAt: number;
  };
}

interface ChallengeInviteLandingProps {
  inviteCode?: string | null;
  onClose: () => void;
  onStartDuel?: (exercise: string, targetReps: number, opponentName: string) => void;
  currentUserWallet?: string;
  currentUserName?: string;
}

export const ChallengeInviteLanding: React.FC<ChallengeInviteLandingProps> = ({
  inviteCode,
  onClose,
  onStartDuel,
  currentUserWallet = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  currentUserName = 'Кузнець Forge'
}) => {
  const [exercise, setExercise] = useState<string>('pushups');
  const [creatorReps, setCreatorReps] = useState<number>(30);
  const [invite, setInvite] = useState<ChallengeInviteRecord | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [guestName, setGuestName] = useState<string>('');
  const [isAccepted, setIsAccepted] = useState<boolean>(false);

  // If inviteCode passed in URL or prop, fetch it
  useEffect(() => {
    if (inviteCode) {
      fetchInvite(inviteCode);
    }
  }, [inviteCode]);

  const fetchInvite = async (code: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/challenges/invite/${code}`);
      if (res.ok) {
        const json = await res.json();
        setInvite(json.invite);
      }
    } catch (err) {
      console.error('Failed to load challenge invite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    sound.playClick();
    setIsLoading(true);
    try {
      const res = await fetch('/api/challenges/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise,
          creatorReps,
          creatorName: currentUserName,
          athleteWallet: currentUserWallet
        })
      });
      if (res.ok) {
        const json = await res.json();
        setInvite(json.invite);
        sound.playTrophy();
      }
    } catch (err) {
      console.error('Failed to create invite:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invite) return;
    sound.playClick();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/challenges/invite/${invite.code}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteName: guestName.trim() || 'Атлет Forge'
        })
      });
      if (res.ok) {
        setIsAccepted(true);
        sound.playTrophy();
        if (onStartDuel) {
          onStartDuel(invite.exercise, invite.creatorReps, invite.creatorName);
        }
      }
    } catch (err) {
      console.error('Failed to accept challenge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteUrl = invite 
    ? `${window.location.origin}/?challenge=${invite.code}`
    : '';

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    sound.playClick();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                {inviteCode && !invite?.acceptedBy ? 'ВИКЛИК НА СИЛОВИЙ БАТЛ' : 'ЗАПРОСИТИ ДРУГА НА ДУЕЛЬ'}
              </h3>
              <p className="text-xs text-neutral-400 font-sans">
                Асинхронний 60-секундний батл з верифікацією техніки
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* If viewing an existing invite to accept */}
          {inviteCode && invite ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                <Flame className="w-8 h-8 text-orange-400" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-white font-heading">
                  {invite.creatorName} КИДАЄ ТОБІ ВИКЛИК!
                </h4>
                <p className="text-xs text-neutral-400">
                  Вправа: <strong className="text-amber-400 uppercase">{invite.exercise}</strong> | Мета: перевершити{' '}
                  <strong className="text-orange-400">{invite.creatorReps} чистих повторень</strong> за 60 секунд.
                </p>
              </div>

              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Ініціатор:</span>
                  <span className="font-bold text-white">{invite.creatorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Рекорд у виклику:</span>
                  <span className="font-bold text-amber-400">{invite.creatorReps} репів</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Контроль CV:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> MediaPipe Anti-Cheat
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-neutral-300">Ваше імʼя або нікнейм:</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Введіть ваш нікнейм..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <button
                onClick={handleAcceptInvite}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-neutral-950 font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer font-heading"
              >
                <Play className="w-4 h-4 fill-neutral-950" />
                ПРИЙНЯТИ ВИКЛИК & СТАРТУВАТИ
              </button>
            </div>
          ) : !invite ? (
            /* Creating a new challenge invite */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Оберіть вправу для дуелі:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pushups', label: 'Віджимання' },
                    { id: 'squats', label: 'Присідання' },
                    { id: 'pullups', label: 'Підтягування' }
                  ].map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => setExercise(ex.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        exercise === ex.id
                          ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">
                  Кількість повторень для перемоги:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={creatorReps}
                    onChange={(e) => setCreatorReps(parseInt(e.target.value))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center py-1 bg-neutral-950 rounded-lg border border-neutral-800 text-amber-400 font-extrabold text-sm font-heading">
                    {creatorReps}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCreateInvite}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer font-heading active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4" />
                ЗГЕНЕРУВАТИ ПОСИЛАННЯ НА ВИКЛИК
              </button>
            </div>
          ) : (
            /* Invite Created - Display Link & Code */
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Check className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-white font-heading">
                  ПОСИЛАННЯ ГОТОВЕ!
                </h4>
                <p className="text-xs text-neutral-400 font-sans">
                  Надішліть це посилання другові у Telegram, Discord або месенджер.
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-neutral-300 truncate text-left">
                  {inviteUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isCopied
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Скопійовано' : 'Копіювати'}
                </button>
              </div>

              <div className="text-[11px] text-neutral-500 font-mono">
                Код виклику: <strong className="text-amber-400">{invite.code}</strong> (дійсний 7 днів)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
