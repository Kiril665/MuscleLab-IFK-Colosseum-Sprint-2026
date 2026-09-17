import React, { useState } from 'react';
import { 
  Flame, 
  Dumbbell, 
  Activity, 
  Sparkles, 
  Clock, 
  Target, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Shield, 
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { Discipline, DifficultyLevel, GoalType, OnboardingData } from '../types';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';

interface OnboardingFlowProps {
  initialUsername?: string;
  initialDiscipline?: Discipline | null;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialUsername = '',
  initialDiscipline = 'hybrid',
  onComplete
}) => {
  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>(initialUsername.replace('@', '') || 'Kuznets');
  const [discipline, setDiscipline] = useState<Discipline>(initialDiscipline || 'hybrid');
  const [experience, setExperience] = useState<DifficultyLevel>('intermediate');
  const [equipment, setEquipment] = useState<string[]>(['турнік', 'бруси', 'гантелі']);
  const [availableTime, setAvailableTime] = useState<number>(45);
  const [goals, setGoals] = useState<GoalType[]>(['hypertrophy', 'strength']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  const equipmentOptions = [
    { id: 'bodyweight', name: 'Власна вага (без спорядження)' },
    { id: 'турнік', name: 'Турнік / Перекладина' },
    { id: 'бруси', name: 'Паралельні бруси' },
    { id: 'гантелі', name: 'Гантелі (розбірні/фіксовані)' },
    { id: 'штанга', name: 'Штанга та силова рама' },
    { id: 'кільця', name: 'Гімнастичні кільця' },
    { id: 'гумові_петлі', name: 'Гумові еспандери / петлі' },
    { id: 'тренажери', name: 'Блокові тренажери залу' }
  ];

  const goalOptions: { id: GoalType; title: string; desc: string }[] = [
    { id: 'hypertrophy', title: 'Гіпертрофія (Мʼязова маса)', desc: 'Збільшення мʼязових обʼємів, округлостей та рельєфу' },
    { id: 'strength', title: 'Абсолютна сила', desc: 'Максимум у базових потягах, жимах та виходах силою' },
    { id: 'endurance', title: 'Силова витривалість', desc: 'Високий темп, робота на час та багатоповторка' },
    { id: 'recomp', title: 'Рекомпозиція тіла', desc: 'Спалювання жиру з одночасним нарощенням щільної мускулатури' }
  ];

  const handleToggleEquipment = (eq: string) => {
    sound.playClick();
    if (equipment.includes(eq)) {
      setEquipment(equipment.filter(e => e !== eq));
    } else {
      setEquipment([...equipment, eq]);
    }
  };

  const handleToggleGoal = (g: GoalType) => {
    sound.playClick();
    if (goals.includes(g)) {
      if (goals.length > 1) {
        setGoals(goals.filter(item => item !== g));
      }
    } else {
      setGoals([...goals, g]);
    }
  };

  const handleNext = () => {
    sound.playClick();
    setError(null);

    if (step === 1) {
      if (!username.trim()) {
        setError("Будь ласка, введіть бажаний username.");
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    sound.playClick();
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    sound.playAnvilHit();

    const finalData: OnboardingData = {
      username: username.startsWith('@') ? username : `@${username}`,
      discipline,
      experience,
      equipment: equipment.length > 0 ? equipment : ['турнік', 'бруси'],
      availableTimeMinutes: availableTime,
      goals
    };

    try {
      await authStore.completeOnboarding(finalData);
      setIsSubmitting(false);
      onComplete();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || "Помилка збереження онбордингу.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-amber-500/30 p-6 sm:p-10 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-neutral-100 my-8">
        
        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold uppercase tracking-wider">
            <span className="text-amber-400 font-bold">Крок {step} з {totalSteps}</span>
            <span>Налаштування твоєї Кузні</span>
          </div>
          <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: Username */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Step 1
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Обери свій унікальний Username
              </h2>
              <p className="text-sm text-neutral-300">
                Твій позивний у спільноті ForgeMuscle, чатах, битвах та списках лідерів.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">Username атлета</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-bold text-amber-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="Kuznets"
                  className="w-full bg-neutral-950 border-2 border-neutral-800 focus:border-amber-500 rounded-2xl pl-10 pr-4 py-3 text-lg font-bold text-white tracking-wide focus:outline-none transition-colors"
                />
              </div>
              <p className="text-xs text-neutral-400">
                Приклад: <span className="text-amber-400 font-mono font-bold">@{username || 'Kuznets'}</span>. Можна змінювати в налаштуваннях.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Training Direction */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Step 2
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Training Direction (Напрямок)
              </h2>
              <p className="text-sm text-neutral-300">
                Обери свою бойову дисципліну. Всі програми, раціони та аналітика підлаштуються під цей вибір.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => {
                  sound.playClick();
                  setDiscipline('bodybuilding');
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  discipline === 'bodybuilding'
                    ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Бодибілдинг</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Залізо, штанги, гіпертрофія мʼязів та рельєфні обʼєми.
                  </p>
                </div>
                {discipline === 'bodybuilding' && (
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Check className="w-3.5 h-3.5" /> Обрано
                  </span>
                )}
              </div>

              <div
                onClick={() => {
                  sound.playClick();
                  setDiscipline('calisthenics');
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  discipline === 'calisthenics'
                    ? 'border-cyan-500 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Калістеніка</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Турніки, бруси, контроль власної ваги та вибухова міць.
                  </p>
                </div>
                {discipline === 'calisthenics' && (
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                    <Check className="w-3.5 h-3.5" /> Обрано
                  </span>
                )}
              </div>

              <div
                onClick={() => {
                  sound.playClick();
                  setDiscipline('hybrid');
                }}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  discipline === 'hybrid'
                    ? 'border-orange-500 bg-orange-500/15 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-2">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">Hybrid</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Синтез важкої бази зі штангою та віртуозного воркауту.
                  </p>
                </div>
                {discipline === 'hybrid' && (
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-orange-400">
                    <Check className="w-3.5 h-3.5" /> Обрано
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Experience */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Step 3
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Experience (Твій досвід)
              </h2>
              <p className="text-sm text-neutral-300">
                Визнач поточний тренувальний рівень для безпечного та точного навантаження.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'beginner' as DifficultyLevel, title: 'Beginner (Початківець)', desc: 'Менше 6 місяців систематичних тренувань. Фокус на вивченні техніки та нейромʼязового звʼязку.' },
                { id: 'intermediate' as DifficultyLevel, title: 'Intermediate (Середній)', desc: 'Від 6 місяців до 2 років стабільної практики. Базова техніка засвоєна, потрібні прогресії перевантаження.' },
                { id: 'advanced' as DifficultyLevel, title: 'Advanced (Досвідчений атлет)', desc: '2+ роки регулярного тренінгу. Досконале володіння тілом або залізом, періодизація та пікові навантаження.' }
              ].map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    setExperience(item.id);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    experience === item.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <div className="text-xs text-neutral-400">{item.desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 ${
                    experience === item.id ? 'border-amber-400 bg-amber-500 text-neutral-950' : 'border-neutral-700'
                  }`}>
                    {experience === item.id && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Equipment */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Step 4
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Equipment (Твоє спорядження)
              </h2>
              <p className="text-sm text-neutral-300">
                Познач все, до чого маєш регулярний доступ (вдома, на вуличному майданчику або в спортзалі).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {equipmentOptions.map(eq => {
                const isSelected = equipment.includes(eq.name);
                return (
                  <div
                    key={eq.id}
                    onClick={() => handleToggleEquipment(eq.name)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500/60 bg-amber-500/15 text-white'
                        : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-semibold">{eq.name}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                      isSelected ? 'border-amber-400 bg-amber-500 text-neutral-950' : 'border-neutral-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Available Training Time */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Step 5
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Available Training Time
              </h2>
              <p className="text-sm text-neutral-300">
                Скільки часу ти готовий виділяти на одне повноцінне тренування?
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { minutes: 20, label: '20 хв', desc: 'Експрес-сесія' },
                { minutes: 35, label: '35 хв', desc: 'Оптимальний темп' },
                { minutes: 50, label: '50 хв', desc: 'Класичний спліт' },
                { minutes: 75, label: '75 хв', desc: 'Важка база' }
              ].map(t => (
                <div
                  key={t.minutes}
                  onClick={() => {
                    sound.playClick();
                    setAvailableTime(t.minutes);
                  }}
                  className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                    availableTime === t.minutes
                      ? 'border-amber-500 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xl font-black text-white font-heading">{t.label}</div>
                  <div className="text-[11px] text-neutral-400 mt-1">{t.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              💡 Ми оптимізуємо структуру розминки, робочих підходів та таймерів відпочинку саме під <span className="text-amber-400 font-bold">{availableTime} хвилин</span>.
            </div>
          </div>
        )}

        {/* STEP 6: Goals */}
        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Step 6
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
                Goals (Твої головні цілі)
              </h2>
              <p className="text-sm text-neutral-300">
                Обери одну або декілька цілей для формування щоденного квесту та раціону.
              </p>
            </div>

            <div className="space-y-3">
              {goalOptions.map(g => {
                const isSelected = goals.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGoal(g.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-white">{g.title}</div>
                      <div className="text-xs text-neutral-400">{g.desc}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 ${
                      isSelected ? 'border-amber-400 bg-amber-500 text-neutral-950' : 'border-neutral-700'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-neutral-800 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/25 ml-auto"
            >
              <span>Далі</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-sm font-black flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_30px_rgba(245,158,11,0.4)] ml-auto font-heading tracking-wider"
            >
              <Flame className="w-5 h-5 fill-neutral-950" />
              <span>{isSubmitting ? 'ВІДКРИВАЄМО КУЗНЮ...' : 'CREATE MY FORGE'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
