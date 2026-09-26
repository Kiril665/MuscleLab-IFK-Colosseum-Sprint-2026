import React, { useState } from 'react';
import { 
  Flame, 
  Dumbbell, 
  Activity, 
  Sparkles, 
  Camera, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Discipline, OnboardingData } from '../types';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';
import { analyticsTracker } from '../services/analyticsTracker';

interface OnboardingFlowProps {
  initialUsername?: string;
  initialDiscipline?: Discipline | null;
  onComplete: () => void;
  onStartPushupTest?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialUsername = '',
  initialDiscipline = 'hybrid',
  onComplete,
  onStartPushupTest
}) => {
  const [username, setUsername] = useState<string>(initialUsername.replace('@', '') || '');
  const [discipline, setDiscipline] = useState<Discipline>(initialDiscipline || 'hybrid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disciplinesConfig = [
    {
      id: 'bodybuilding' as Discipline,
      name: 'Бодибілдинг',
      icon: Dumbbell,
      desc: 'Гіпертрофія, залізо, пропорції'
    },
    {
      id: 'calisthenics' as Discipline,
      name: 'Калістеніка',
      icon: Activity,
      desc: 'Власна вага, турніки, баланс'
    },
    {
      id: 'hybrid' as Discipline,
      name: 'Гібрид',
      icon: Flame,
      desc: 'Синтез заліза та воркауту'
    }
  ];

  const handleStartPushupTest = async () => {
    setError(null);
    setIsSubmitting(true);
    sound.playAnvilHit();

    const cleanUsername = username.trim().startsWith('@') 
      ? username.trim() 
      : `@${username.trim() || 'athlete'}`;

    const finalData: OnboardingData = {
      username: cleanUsername,
      discipline,
      experience: 'intermediate',
      equipment: ['турнік', 'підлога', 'бруси'],
      availableTimeMinutes: 45,
      goals: ['strength', 'hypertrophy']
    };

    try {
      await authStore.completeOnboarding(finalData);
      analyticsTracker.track('activation_first_workout', { discipline, username: cleanUsername });
      setIsSubmitting(false);
      onComplete();
      if (onStartPushupTest) {
        onStartPushupTest();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Помилка ініціалізації профілю.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/92 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.25)] text-neutral-100 my-8">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Швидкий старт у Кузні (&lt; 60с)
          </div>
          <span className="text-xs font-mono text-neutral-400">
            Push-up Verification Entry
          </span>
        </div>

        {/* Hero title */}
        <div className="space-y-2 mb-6 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-white font-heading uppercase tracking-tight">
            ОТРИМАЙ СВІЙ FORGE PASSPORT
          </h1>
          <p className="text-sm text-neutral-300">
            Жодних нудних опитувальників про дієти: ставай перед камерою на 60 секунд. 
            AI-верифікатор зафіксує твій базовий рівень у мережі Solana.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Athlete Nickname */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Твій бойовий нікнейм у Кузні:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                placeholder="alex_forge"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-400 pl-8 pr-4 py-3 rounded-xl text-white font-mono text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Discipline Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Твоя основа (дисципліна):
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {disciplinesConfig.map((item) => {
                const Icon = item.icon;
                const isSelected = discipline === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setDiscipline(item.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <div className="text-xs font-bold font-heading">{item.name}</div>
                    <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Props Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Як працює верифікація першого тренування:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>MediaPipe Pose відстежує лікті й таз</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Рахуються тільки повтори з &gt;85% ROM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Криптографічний підпис серверного Nonce</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Відкриття 60s Battle та лідербордів</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleStartPushupTest}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-neutral-950 font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-5 h-5 text-neutral-950" />
            <span>{isSubmitting ? 'Ініціалізація...' : '🔥 Почати Push-up Тест (< 60с)'}</span>
            <ArrowRight className="w-4 h-4 text-neutral-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
