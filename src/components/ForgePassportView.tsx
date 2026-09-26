import React, { useState, useEffect } from 'react';
import { 
  ForgePassportData, 
  ForgeProgressionTier, 
  VerifiedAchievement 
} from '../types';
import { forgeGameStore, FORGE_TIER_CONFIG } from '../services/forgeGameStore';
import { sound } from '../services/soundEngine';
import { connectSolanaWallet, disconnectSolanaWallet } from '../services/solanaWallet';
import confetti from 'canvas-confetti';
import { 
  Shield, 
  Flame, 
  Swords, 
  Trophy, 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Wallet, 
  Activity, 
  Zap, 
  Lock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ForgePassportViewProps {
  onStartBattle: () => void;
  onStartVerification: () => void;
}

export const ForgePassportView: React.FC<ForgePassportViewProps> = ({
  onStartBattle,
  onStartVerification
}) => {
  const [passport, setPassport] = useState<ForgePassportData>(forgeGameStore.getPassport());
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<VerifiedAchievement | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = forgeGameStore.subscribe(() => {
      setPassport(forgeGameStore.getPassport());
    });
    return () => unsub();
  }, []);

  const copyWallet = () => {
    if (!passport.walletAddress) return;
    navigator.clipboard.writeText(passport.walletAddress);
    setCopiedWallet(true);
    sound.playClick();
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handleConnectWallet = async () => {
    setWalletBusy(true);
    setWalletError(null);
    try {
      const address = await connectSolanaWallet();
      forgeGameStore.setWalletAddress(address);
      sound.playLevelUp();
    } catch (error: any) {
      setWalletError(error?.message || 'Не вдалося підключити Solana wallet.');
    } finally {
      setWalletBusy(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setWalletBusy(true);
    setWalletError(null);
    try {
      await disconnectSolanaWallet();
      forgeGameStore.setWalletAddress('');
    } catch (error: any) {
      setWalletError(error?.message || 'Не вдалося відключити wallet.');
    } finally {
      setWalletBusy(false);
    }
  };

  const currentTierInfo = FORGE_TIER_CONFIG[passport.forgeTier] || FORGE_TIER_CONFIG.raw_metal;
  const tiers: ForgeProgressionTier[] = [
    'raw_metal',
    'forged',
    'muscles',
    'armor',
    'fire_aura',
    'tempered_steel',
    'legendary_forge'
  ];

  const currentTierIndex = tiers.indexOf(passport.forgeTier);
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const nextTierInfo = nextTier ? FORGE_TIER_CONFIG[nextTier] : null;

  // Calculate progress toward next tier
  let progressPercent = 100;
  if (nextTierInfo) {
    const repsNeeded = nextTierInfo.minRepsRequired - currentTierInfo.minRepsRequired;
    const repsDone = Math.max(0, passport.totalVerifiedReps - currentTierInfo.minRepsRequired);
    progressPercent = Math.min(100, Math.round((repsDone / repsNeeded) * 100));
  }

  const winRate = passport.battlesCount > 0 
    ? Math.round((passport.winsCount / passport.battlesCount) * 100) 
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* Top Identity & Philosophy Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-wider uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Forge Passport • Verified On-Chain</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{currentTierInfo.badge}</span>
              <span>{currentTierInfo.title}</span>
              <span className="text-lg md:text-2xl font-normal text-neutral-400">({currentTierInfo.subtitle})</span>
            </h1>

            {/* Core Philosophy Quote */}
            <p className="text-sm md:text-base text-amber-200/90 italic font-serif border-l-2 border-amber-500/50 pl-3">
              «You cannot buy reputation in ForgeMuscle. You have to earn it physically.»
            </p>
          </div>

          {/* Solana Wallet & Network Status Card */}
          <div className="w-full md:w-auto bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2.5 backdrop-blur-sm min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                Solana Devnet
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                passport.walletAddress 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-neutral-800 text-neutral-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${passport.walletAddress ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                {passport.walletAddress ? 'Підключено' : 'Wallet не підключено'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-neutral-900 px-3 py-2 rounded-xl border border-neutral-800/80">
              <span className="font-mono text-xs text-neutral-300 truncate max-w-[190px]">
                {passport.walletAddress || 'Wallet не підключено'}
              </span>
              {passport.walletAddress && (
                <button 
                  onClick={copyWallet}
                  className="text-neutral-400 hover:text-white transition-colors p-1"
                  title="Копіювати адресу"
                >
                  {copiedWallet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={passport.walletAddress ? handleDisconnectWallet : handleConnectWallet}
                disabled={walletBusy}
                className="flex-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {walletBusy ? 'Підключення…' : passport.walletAddress ? 'Відключити' : 'Підключити Solana Wallet'}
              </button>
            </div>
            {walletError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {walletError}
              </div>
            )}
            <div className="text-[11px] text-neutral-500 flex items-center justify-between">
              <span>Attestation Engine:</span>
              <span className="font-mono text-neutral-400">ForgeVerifierAuthority</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-4">
          <button
            onClick={onStartBattle}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-950/50 hover:opacity-95 transition-all transform active:scale-95"
          >
            <Swords className="w-4 h-4" />
            <span>Швидкий 60s Батл</span>
          </button>

          <button
            onClick={onStartVerification}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-sm tracking-wide transition-all transform active:scale-95"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Соло Верифікація Камерою</span>
          </button>
        </div>
      </div>

      {/* Verified Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Verified Reps
          </span>
          <div className="my-2">
            <span className="text-4xl font-black text-white tracking-tight font-mono">
              {passport.totalVerifiedReps}
            </span>
          </div>
          <span className="text-xs text-neutral-500">Зафіксовано Computer Vision</span>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-red-400" />
            Battles Fought
          </span>
          <div className="my-2">
            <span className="text-4xl font-black text-white tracking-tight font-mono">
              {passport.battlesCount}
            </span>
          </div>
          <span className="text-xs text-neutral-500">{passport.winsCount} Перемог • {passport.lossesCount} Поразок</span>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            Win Rate
          </span>
          <div className="my-2">
            <span className="text-4xl font-black text-yellow-400 tracking-tight font-mono">
              {winRate}%
            </span>
          </div>
          <span className="text-xs text-neutral-500">60-секундні дуелі</span>
        </div>

        <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Solana Receipts
          </span>
          <div className="my-2">
            <span className="text-4xl font-black text-cyan-400 tracking-tight font-mono">
              {passport.achievements.length}
            </span>
          </div>
          <span className="text-xs text-neutral-500">Закарбування в блокчейні</span>
        </div>
      </div>

      {/* Personal Records (PRs) */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Верифіковані рекорди (60s PRs)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Максимальна кількість повторень за 60 секунд з підтвердженою 100% амплітудою (ROM)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                60s Push-ups
              </span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {passport.personalRecords.pushups60s}
              </span>
              <span className="text-xs text-neutral-500 block mt-0.5">Віджимання від підлоги</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
              ⚔️
            </div>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                60s Squats
              </span>
              <span className="text-3xl font-black text-orange-400 font-mono">
                {passport.personalRecords.squats60s}
              </span>
              <span className="text-xs text-neutral-500 block mt-0.5">Глибокі присідання</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg">
              🛡️
            </div>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                60s Pull-ups
              </span>
              <span className="text-3xl font-black text-cyan-400 font-mono">
                {passport.personalRecords.pullups60s}
              </span>
              <span className="text-xs text-neutral-500 block mt-0.5">Підтягування до підборіддя</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
              🦅
            </div>
          </div>
        </div>
      </div>

      {/* Forge Progression: 7 Stages of the Anvil */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Прогресія Кузні (Forge Progression)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Рівні залежать виключно від перевірених досягнень, а не штучних балів.
            </p>
          </div>

          {nextTierInfo && (
            <div className="text-xs font-mono text-neutral-400">
              До <span className="text-amber-400 font-bold">{nextTierInfo.title}</span>: {nextTierInfo.minRepsRequired - passport.totalVerifiedReps} репів, {Math.max(0, nextTierInfo.minWinsRequired - passport.winsCount)} перемог
            </div>
          )}
        </div>

        {/* Progression Track */}
        <div className="relative pt-2 pb-4">
          <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className="h-full bg-gradient-to-r from-neutral-600 via-amber-500 to-orange-500 transition-all duration-700"
              style={{ width: `${Math.min(100, ((currentTierIndex + 1) / tiers.length) * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-7 gap-2 mt-4">
            {tiers.map((t, idx) => {
              const info = FORGE_TIER_CONFIG[t];
              const isPassed = idx <= currentTierIndex;
              const isCurrent = idx === currentTierIndex;

              return (
                <div 
                  key={t}
                  className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                    isCurrent 
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/40' 
                      : isPassed 
                        ? 'bg-neutral-950/80 border-neutral-800 text-neutral-300' 
                        : 'bg-neutral-950/30 border-neutral-900/60 opacity-40 text-neutral-500'
                  }`}
                >
                  <span className="text-2xl mb-1">{info.badge}</span>
                  <span className={`text-[11px] font-bold tracking-tight truncate w-full ${isCurrent ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {info.title}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
                    {info.minRepsRequired}+ репів
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Tier Detail & Requirement Banner */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase text-amber-500 font-bold tracking-wider">
              Поточний статус • {currentTierInfo.title} ({currentTierInfo.subtitle})
            </span>
            <p className="text-sm text-neutral-300">
              {currentTierInfo.unlockCondition}
            </p>
          </div>

          {nextTierInfo ? (
            <div className="bg-neutral-900 border border-neutral-800 px-4 py-2.5 rounded-xl text-xs font-mono text-neutral-300">
              Наступний етап: <span className="text-amber-400 font-bold">{nextTierInfo.title}</span> ({nextTierInfo.minRepsRequired} репів, {nextTierInfo.minWinsRequired} перемог)
            </div>
          ) : (
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-bold">
              Максимальний рівень Кузні досягнуто! 👑
            </div>
          )}
        </div>
      </div>

      {/* Verified Achievements Secured on Solana */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Верифіковані досягнення в Solana (SBT / Proofs)
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Кожне досягнення криптографічно підписане сервером і зафіксоване в мережі Solana
            </p>
          </div>

          <span className="text-xs font-mono text-neutral-500">
            Всього: {passport.achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {passport.achievements.map((ach) => (
            <div 
              key={ach.id}
              className="bg-neutral-950 border border-neutral-800/90 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                  {ach.badgeIcon}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{ach.title}</h3>
                    <span className="text-[10px] font-mono text-neutral-500 flex-shrink-0">
                      {new Date(ach.earnedAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {ach.description}
                  </p>
                </div>
              </div>

              {/* Solana Proof & Tx Details */}
              <div className="pt-3 border-t border-neutral-900 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500 truncate max-w-[170px] text-[11px]">
                  Tx: {ach.solanaTxSignature.substring(0, 16)}...
                </span>

                <a 
                  href={ach.solanaExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors"
                >
                  <span>Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
