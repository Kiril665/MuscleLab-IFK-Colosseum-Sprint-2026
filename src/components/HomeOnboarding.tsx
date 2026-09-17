import React, { useState, useEffect } from 'react';
import { Flame, Dumbbell, Activity, ShieldAlert, ArrowRight, Zap, CheckCircle, Sparkles, Utensils, MessageSquare, Brain, Target, Dices, Award, Calendar, Compass, ShieldCheck, Check } from 'lucide-react';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { Discipline } from '../types';
import { journeyStore } from '../services/journeyStore';

interface HomeOnboardingProps {
  onSelectDiscipline: (discipline: Discipline) => void;
  selectedDiscipline: Discipline | null;
  onNavigate: (tab: string) => void;
}

export const HomeOnboarding: React.FC<HomeOnboardingProps> = ({
  onSelectDiscipline,
  selectedDiscipline,
  onNavigate
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [journey, setJourney] = useState(journeyStore.getJourney());

  useEffect(() => {
    const unsub = journeyStore.subscribe(() => {
      setJourney(journeyStore.getJourney());
    });
    return () => unsub();
  }, []);

  const handleDisciplineClick = (disc: Discipline) => {
    sound.playAnvilHit();
    onSelectDiscipline(disc);

    const names = {
      bodybuilding: 'Бодибілдинг. Залізна маса та гіпертрофія!',
      calisthenics: 'Калістеніка. Повний контроль тіла та гравітації!',
      hybrid: 'Гібридний атлетизм. Сила заліза та витривалість турніків!'
    };
    arnoVoice.speak(`Обрано напрямок: ${names[disc]} Програми та раціон оновлено!`, { force: true });
  };

  const disciplinesConfig = [
    {
      id: 'bodybuilding' as Discipline,
      title: 'Бодибілдинг',
      subtitle: 'Залізо, Гіпертрофія та Симетрія',
      icon: Dumbbell,
      badge: 'Iron Path',
      color: 'from-amber-500/20 to-orange-600/20 border-amber-500/40 hover:border-amber-400',
      textColor: 'text-amber-400',
      description: 'Робота з вільними вагами та тренажерами для максимального збільшення мʼязових обʼємів, рельєфу та пропорцій.',
      focus: 'Ізоляція, прогресивне перевантаження, глибока гіпертрофія'
    },
    {
      id: 'calisthenics' as Discipline,
      title: 'Калістеніка',
      subtitle: 'Гравітація, Турніки та Повний Контроль',
      icon: Activity,
      badge: 'Gravity Rebel',
      color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40 hover:border-cyan-400',
      textColor: 'text-cyan-400',
      description: 'Мистецтво володіння власною вагою на перекладині та брусах. Вибухова міць, сухий рельєф та сталева витривалість.',
      focus: 'Відносна сила, статичні горизонти, здорові звʼязки'
    },
    {
      id: 'hybrid' as Discipline,
      title: 'Гібридний Атлетизм',
      subtitle: 'Абсолютний Синтез Заліза та Воркауту',
      icon: Flame,
      badge: 'Titan Fusion',
      color: 'from-orange-500/20 to-red-600/20 border-orange-500/50 hover:border-orange-400',
      textColor: 'text-orange-400',
      description: 'Поєднання важких базових присідань і тяг зі штангою та віртуозних виходів на перекладині. Тіло без слабких місць.',
      focus: 'Максимальний функціонал, естетика та безжальна міць'
    }
  ];

  const comparisonData = [
    {
      param: 'Необхідне обладнання',
      bodybuilding: 'Штанги, гантелі, силова рама, лави, блоки',
      calisthenics: 'Турнік, бруси, підлога, гімнастичні кільця',
      hybrid: 'Мінімум: турнік + бруси + важкі гантелі / штанга'
    },
    {
      param: 'Час на тренування',
      bodybuilding: '60–80 хв (триваліший відпочинок між сетами)',
      calisthenics: '45–60 хв (висока щільність та колові сети)',
      hybrid: '50–70 хв (збалансований темп)'
    },
    {
      param: 'Поріг входу',
      bodybuilding: 'Низький: легко масштабувати вагу від 5 кг',
      calisthenics: 'Середній: потрібна базова сила для перших підтягувань',
      hybrid: 'Середній: потребує базового відчуття тіла'
    },
    {
      param: 'Фінальний результат',
      bodybuilding: 'Масивні опуклі мʼязові форми, широкі плечі, товщина',
      calisthenics: 'Сухий жилавий атлетизм, сталевий хват, гнучкість',
      hybrid: 'Гармонійно розвинений універсальний воїн-атлет'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Atmosphere Banner with Sound Interaction */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-neutral-900 shadow-[0_0_40px_rgba(245,158,11,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent z-10" />
        
        {/* Ambient background visual elements */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-64 h-64 bg-amber-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-20 p-8 sm:p-12 lg:p-14 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Forge your training. Build your progress.
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading">
            ВИКУЙ СВОЄ ТІЛО В <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">ПОЛУМʼЇ ЗАЛІЗА ТА ГРАВІТАЦІЇ</span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed font-sans">
            Ласкаво просимо до <span className="text-amber-400 font-semibold">ForgeMuscle</span> — платформу синтезу бодибілдингу, калістеніки, RPG-прогресії та здорової спортивної спільноти: <b className="text-neutral-100">TRAIN → LEVEL UP → BATTLE → LEARN → SHARE → RETURN</b>.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              id="hero-start-training-btn"
              onClick={() => {
                sound.playClick();
                onNavigate('camera');
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading tracking-wide"
            >
              <Flame className="w-4 h-4 fill-neutral-950" />
              START TRAINING
            </button>

            <button
              id="hero-forge-it-btn"
              onClick={() => {
                sound.playAnvilHit();
                onNavigate('journey');
              }}
              className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-500/50 text-amber-300 hover:text-amber-200 font-bold text-sm transition-all cursor-pointer font-heading flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              FORGE IT (План)
            </button>

            <button
              id="hero-battle-btn"
              onClick={() => {
                sound.playClick();
                onNavigate('battle');
              }}
              className="px-5 py-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 font-bold text-sm transition-all cursor-pointer font-heading flex items-center gap-2"
            >
              <Target className="w-4 h-4 text-red-400" />
              BATTLE
            </button>

            <button
              id="hero-community-btn"
              onClick={() => {
                sound.playClick();
                onNavigate('community');
              }}
              className="px-5 py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-bold text-sm transition-all cursor-pointer font-heading flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              COMMUNITY
            </button>
          </div>
        </div>

        {/* Brand visual emblem badge */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 z-20">
          <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <img
              src="/src/assets/images/forgemuscle_logo.jpg"
              alt="ForgeMuscle Crest"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* ==================== TODAY'S DASHBOARD ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 font-heading tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              СЬОГОДНІ В FORGE: ПАНЕЛЬ АКТИВНОСТІ
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onNavigate('journey');
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            Мій Forge Journey <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Today's Workout */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('journey');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Тренування дня</span>
            <div className="my-1.5 font-bold text-xs text-neutral-100 line-clamp-1">
              {journey.todayWorkout?.title || 'Upper Body Power'}
            </div>
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              {journey.todayWorkout?.durationMinutes || 45} хв • {journey.todayWorkout?.exercises.length || 4} вправи
            </span>
          </div>

          {/* 2. Current Battle */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('battle');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-red-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Battle Mode</span>
            <div className="my-1.5 font-bold text-xs text-red-400">
              Iron vs Street
            </div>
            <span className="text-[10px] text-neutral-400">Раунд 14 • 54% vs 46%</span>
          </div>

          {/* 3. Level */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('profile_quests');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Рівень Forge</span>
            <div className="my-1.5 font-black text-lg text-amber-400 font-heading">
              LVL {journey.level}
            </div>
            <span className="text-[10px] text-neutral-400">{journey.rankTitle}</span>
          </div>

          {/* 4. XP Progress */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('profile_quests');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Досвід (XP)</span>
            <div className="my-1.5 font-bold text-xs text-neutral-200">
              {journey.xp} / {journey.xpForNextLevel} XP
            </div>
            <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((journey.xp / journey.xpForNextLevel) * 100))}%` }}
              />
            </div>
          </div>

          {/* 5. Streak */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('journey');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-orange-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Стрік Серії</span>
            <div className="my-1.5 font-bold text-base text-orange-400 flex items-center gap-1">
              <Flame className="w-4 h-4 fill-orange-400" />
              {journey.streakDays} дні(в)
            </div>
            <span className="text-[10px] text-neutral-400">Без пропусків!</span>
          </div>

          {/* 6. Recommended Lesson */}
          <div
            onClick={() => {
              sound.playClick();
              onNavigate('education');
            }}
            className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] uppercase font-bold text-neutral-400">Forge Academy</span>
            <div className="my-1.5 font-bold text-xs text-blue-400 line-clamp-1">
              Біомеханіка & Сон
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">+150 XP тест</span>
          </div>
        </div>
      </section>

      {/* Goal Selection Quiz Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
            Крок 1: Твоя Філософія
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
            ОБЕРИ СВІЙ БОЙОВИЙ НАПРЯМОК
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base font-sans">
            Кожен шлях веде до величі, але вимагає своєї зброї. Обери напрямок для персоналізації програм та участі в щотижневому Battle Mode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {disciplinesConfig.map((disc) => {
            const Icon = disc.icon;
            const isSelected = selectedDiscipline === disc.id;
            return (
              <div
                key={disc.id}
                id={`discipline-card-${disc.id}`}
                onClick={() => handleDisciplineClick(disc.id)}
                onMouseEnter={() => setHoveredCard(disc.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden bg-gradient-to-b ${disc.color} ${
                  isSelected
                    ? 'ring-2 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] scale-[1.02]'
                    : 'bg-neutral-900/60 hover:bg-neutral-900/90'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-neutral-950 text-xs font-extrabold uppercase">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Обрано
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 ${disc.textColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-0.5 rounded bg-neutral-950/70 border border-neutral-800">
                      {disc.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-2xl font-bold font-heading ${disc.textColor}`}>
                      {disc.title}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-300 mt-0.5">
                      {disc.subtitle}
                    </p>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                    {disc.description}
                  </p>

                  <div className="pt-2 text-xs text-neutral-400 border-t border-neutral-800/80">
                    <span className="font-semibold text-neutral-200">Фокус: </span>
                    {disc.focus}
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisciplineClick(disc.id);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer font-heading ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 shadow-lg ring-2 ring-amber-300'
                        : 'bg-neutral-800/90 hover:bg-neutral-700 text-white border border-neutral-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-neutral-950" />
                        Поточний активний напрямок
                      </>
                    ) : (
                      <>
                        Обрати {disc.title}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparative Table Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Аналіз Сил
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              ПОРІВНЯЛЬНА ТАБЛИЦЯ НАПРЯМКІВ
            </h2>
            <p className="text-neutral-400 text-sm font-sans">
              Оціни вимоги та переваги кожної дисципліни перед початком занять.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-300 font-heading uppercase text-xs">
              <tr>
                <th className="py-4 px-6 text-neutral-400">Параметр</th>
                <th className="py-4 px-6 text-amber-400">Бодибілдинг</th>
                <th className="py-4 px-6 text-cyan-400">Калістеніка</th>
                <th className="py-4 px-6 text-orange-400">Гібрид</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {comparisonData.map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-850/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-neutral-300 whitespace-nowrap">
                    {row.param}
                  </td>
                  <td className="py-4 px-6 text-neutral-300">
                    {row.bodybuilding}
                  </td>
                  <td className="py-4 px-6 text-neutral-300">
                    {row.calisthenics}
                  </td>
                  <td className="py-4 px-6 text-neutral-300">
                    {row.hybrid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== PROBLEM -> SOLUTION MAPPING ==================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Проблема → Рішення ForgeMuscle
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            ЧОМУ ЗВИЧАЙНИЙ ФІТНЕС НАДОКУЧАЄ, А FORGE ПРАЦЮЄ
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Ми проаналізували 5 головних барʼєрів, через які люди кидають спорт, і вирішили їх архітектурно.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-xs text-red-400 font-bold block">❌ Confusion</span>
            <p className="text-xs text-neutral-400">«Не знаю, що робити сьогодні в залі»</p>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Forge Journey
              </span>
              <p className="text-[11px] text-neutral-300 mt-1">Чіткий персональний щоденний план без сумнівів.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-xs text-red-400 font-bold block">❌ Boring</span>
            <p className="text-xs text-neutral-400">«Одноманітно і нудно рахувати підходи»</p>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Forge Game
              </span>
              <p className="text-[11px] text-neutral-300 mt-1">Рівні, XP, щотижневі Battle та щоденні квести.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-xs text-red-400 font-bold block">❌ Loneliness</span>
            <p className="text-xs text-neutral-400">«Немає з ким ділитися та змагатися»</p>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Community & Chat
              </span>
              <p className="text-[11px] text-neutral-300 mt-1">Кімнати за інтересами, гільдії, спільні стріки.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-xs text-red-400 font-bold block">❌ Bad Form</span>
            <p className="text-xs text-neutral-400">«Боюся травмуватися без тренера»</p>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Camera AI & Arno
              </span>
              <p className="text-[11px] text-neutral-300 mt-1">Контроль кутів суглобів та голосові підказки.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <span className="text-xs text-red-400 font-bold block">❌ Chaos</span>
            <p className="text-xs text-neutral-400">«Не можу тренуватися за шаблоном»</p>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Forge Engine
              </span>
              <p className="text-[11px] text-neutral-300 mt-1">Генерація під наявні гантелі чи лише власну вагу.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ForgeMuscle Ecosystem Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            TRAIN • COMPETE • LEARN • SHARE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            ЕКОСИСТЕМА FORGEMUSCLE
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Все необхідне для твого всебічного розвитку: від тренувань з компʼютерним зором до спільноти однодумців та бази знань.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => { sound.playClick(); onNavigate('community'); }}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-850 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-heading group-hover:text-amber-400 transition-colors">
              Forge Community 🧠
            </h3>
            <p className="text-xs text-neutral-400">
              Гайди, обговорення, питання "Ask the Forge", гільдії атлетів та система репутації.
            </p>
          </div>

          <div
            onClick={() => { sound.playClick(); onNavigate('education'); }}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-850 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-heading group-hover:text-amber-400 transition-colors">
              Forge Wiki & Quiz 📚
            </h3>
            <p className="text-xs text-neutral-400">
              Спільна енциклопедія знань та інтерактивна вікторина "Міф чи Факт" з нагородами XP.
            </p>
          </div>

          <div
            onClick={() => { sound.playClick(); onNavigate('profile_quests'); }}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-850 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-heading group-hover:text-amber-400 transition-colors">
              Quests & Challenges 🎯
            </h3>
            <p className="text-xs text-neutral-400">
              Daily Quests, щотижневі виклики, Random Challenge 🎲 та персональний Forge Score.
            </p>
          </div>

          <div
            onClick={() => { sound.playClick(); onNavigate('battle'); }}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-850 transition-all cursor-pointer space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-heading group-hover:text-amber-400 transition-colors">
              Battle Mode ⚔️
            </h3>
            <p className="text-xs text-neutral-400">
              Війна дисциплін: Бодибілдинг проти Калістеніки. Твої тренування приносять бали команді!
            </p>
          </div>
        </div>
      </section>

      {/* Quick Launch Action Banner */}
      <div className="rounded-2xl border border-amber-500/30 p-6 sm:p-8 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white font-heading">
            Готовий до першого тренування?
          </h3>
          <p className="text-sm text-neutral-300 font-sans">
            Запусти Камера-трекер, і Арно оцінить твою форму в прямому ефірі з підрахунком повторень.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="onboarding-goto-nutrition"
            onClick={() => {
              sound.playClick();
              onNavigate('nutrition');
            }}
            className="px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 hover:border-amber-500/50 transition-all cursor-pointer font-heading flex items-center gap-2"
          >
            <Utensils className="w-4 h-4 text-amber-400" />
            Розрахувати Раціон
          </button>

          <button
            id="onboarding-goto-camera"
            onClick={() => {
              sound.playAnvilHit();
              onNavigate('camera');
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading"
          >
            Відкрити Камера-трекер
          </button>
        </div>
      </div>
    </div>
  );
};
