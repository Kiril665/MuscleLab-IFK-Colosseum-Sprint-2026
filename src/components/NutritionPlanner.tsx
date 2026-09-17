import React, { useState, useEffect } from 'react';
import { Discipline, GoalType } from '../types';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import { 
  Utensils, 
  Flame, 
  Apple, 
  Droplet, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Calculator, 
  Clock, 
  Coffee, 
  Moon, 
  Sun, 
  Dumbbell, 
  Layers, 
  RotateCcw,
  Volume2
} from 'lucide-react';

interface FoodLogItem {
  id: string;
  name: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  grams: number;
}

interface NutritionPlannerProps {
  userDiscipline: Discipline | null;
}

export const NutritionPlanner: React.FC<NutritionPlannerProps> = ({ userDiscipline }) => {
  // Calculator params
  const [weight, setWeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('forgemuscle_user_weight');
      return saved ? parseFloat(saved) : 75;
    } catch {
      return 75;
    }
  });

  const [height, setHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('forgemuscle_user_height');
      return saved ? parseFloat(saved) : 178;
    } catch {
      return 178;
    }
  });

  const [goal, setGoal] = useState<GoalType>('hypertrophy');
  const [activityMultiplier, setActivityMultiplier] = useState<number>(1.55); // moderate activity (3-5 workouts)
  const [waterDrunk, setWaterDrunk] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('forgemuscle_water_drunk');
      return saved ? parseFloat(saved) : 1.5;
    } catch {
      return 1.5;
    }
  });

  // Daily Meal Log
  const [logs, setLogs] = useState<FoodLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('forgemuscle_food_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      { id: '1', name: 'Вівсянка на воді з бананом та медом', meal: 'breakfast', calories: 380, protein: 12, carbs: 70, fats: 6, grams: 250 },
      { id: '2', name: 'Яєчня з 4 яєць (2 цілих + 2 білки)', meal: 'breakfast', calories: 220, protein: 24, carbs: 2, fats: 12, grams: 180 },
      { id: '3', name: 'Куряче філе запечене + Гречка', meal: 'lunch', calories: 520, protein: 48, carbs: 62, fats: 8, grams: 350 },
      { id: '4', name: 'Сир кисломолочний 5% + Ягоди', meal: 'dinner', calories: 290, protein: 34, carbs: 18, fats: 7, grams: 220 }
    ];
  });

  // Quick add form state
  const [newFoodName, setNewFoodName] = useState('');
  const [newMeal, setNewMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [newCalories, setNewCalories] = useState<string>('300');
  const [newProtein, setNewProtein] = useState<string>('25');
  const [newCarbs, setNewCarbs] = useState<string>('30');
  const [newFats, setNewFats] = useState<string>('8');
  const [newGrams, setNewGrams] = useState<string>('200');

  // Selected quick preset tab
  const [activeTab, setActiveTab] = useState<'calculator' | 'journal' | 'recipes' | 'timing'>('calculator');

  // Persist weight
  useEffect(() => {
    try {
      localStorage.setItem('forgemuscle_user_weight', weight.toString());
      localStorage.setItem('forgemuscle_user_height', height.toString());
    } catch {
      // ignore
    }
  }, [weight, height]);

  // Persist logs
  const saveLogs = (newLogs: FoodLogItem[]) => {
    setLogs(newLogs);
    try {
      localStorage.setItem('forgemuscle_food_logs', JSON.stringify(newLogs));
    } catch {
      // ignore
    }
  };

  const saveWater = (amount: number) => {
    setWaterDrunk(amount);
    try {
      localStorage.setItem('forgemuscle_water_drunk', amount.toString());
    } catch {
      // ignore
    }
  };

  // Mifflin-St Jeor Formula for BMR & TDEE
  // Approx male: 10 * weight + 6.25 * height - 5 * 25 + 5
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * 26 + 5);
  const maintenanceTdee = Math.round(bmr * activityMultiplier);

  const targetCalories = Math.round(
    goal === 'hypertrophy'
      ? maintenanceTdee + 350
      : goal === 'strength'
      ? maintenanceTdee + 200
      : goal === 'endurance'
      ? maintenanceTdee
      : maintenanceTdee - 450
  );

  // Target Macros
  const targetProteinGrams = Math.round(
    goal === 'hypertrophy'
      ? weight * 2.0
      : goal === 'recomp'
      ? weight * 2.2
      : goal === 'strength'
      ? weight * 1.9
      : weight * 1.6
  );

  const targetFatsGrams = Math.round(weight * 0.95);
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - targetProteinGrams * 4 - targetFatsGrams * 9);
  const targetCarbsGrams = Math.round(remainingCaloriesForCarbs / 4);
  const targetWaterLiters = (weight * 0.038).toFixed(1);

  // Totals logged today
  const consumedCalories = logs.reduce((acc, item) => acc + item.calories, 0);
  const consumedProtein = logs.reduce((acc, item) => acc + item.protein, 0);
  const consumedCarbs = logs.reduce((acc, item) => acc + item.carbs, 0);
  const consumedFats = logs.reduce((acc, item) => acc + item.fats, 0);

  // Handle Voice Advice
  const handleArnoNutritionAdvice = () => {
    sound.playClick();
    const deficitOrSurplus = goal === 'hypertrophy' ? 'профіцит у триста пʼятдесят калорій' : 'дефіцит калорій для рельєфу';
    const speech = `Слухай установку по раціону: Твоя норма білка — ${targetProteinGrams} грамів. Загальний калораж — ${targetCalories} кілокалорій. Дотримуйся правила: ${deficitOrSurplus}, пий не менше трьох літрів чистої води та спи вісім годин!`;
    arnoVoice.speak(speech, { force: true });
  };

  // Add Item to log
  const handleAddFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    sound.playClick();
    const newItem: FoodLogItem = {
      id: `food_${Date.now()}`,
      name: newFoodName.trim(),
      meal: newMeal,
      calories: parseInt(newCalories) || 0,
      protein: parseInt(newProtein) || 0,
      carbs: parseInt(newCarbs) || 0,
      fats: parseInt(newFats) || 0,
      grams: parseInt(newGrams) || 100
    };

    saveLogs([newItem, ...logs]);
    setNewFoodName('');
  };

  const handleDeleteFood = (id: string) => {
    sound.playClick();
    saveLogs(logs.filter((x) => x.id !== id));
  };

  // Quick preset foods
  const quickPresets = [
    { name: 'Куряче філе відварене (150г)', meal: 'lunch' as const, c: 247, p: 46, k: 0, f: 5, g: 150 },
    { name: 'Гречана каша варена (200г)', meal: 'lunch' as const, c: 220, p: 8, k: 44, f: 2, g: 200 },
    { name: 'Яйця курячі варені (3 шт)', meal: 'breakfast' as const, c: 215, p: 18, k: 1, f: 15, g: 160 },
    { name: 'Сир кисломолочний 5% (200г)', meal: 'dinner' as const, c: 242, p: 34, k: 4, f: 10, g: 200 },
    { name: 'Протеїновий шейк з молоком', meal: 'snack' as const, c: 260, p: 32, k: 14, f: 4, g: 300 },
    { name: 'Банан стиглий (1 великий)', meal: 'snack' as const, c: 105, p: 1, k: 27, f: 0.3, g: 120 }
  ];

  const handleAddPreset = (p: typeof quickPresets[0]) => {
    sound.playClick();
    const newItem: FoodLogItem = {
      id: `food_${Date.now()}`,
      name: p.name,
      meal: p.meal,
      calories: p.c,
      protein: p.p,
      carbs: p.k,
      fats: p.f,
      grams: p.g
    };
    saveLogs([newItem, ...logs]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-neutral-900 p-6 sm:p-10 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              Раціон Кузні Мʼязів
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              СПОРТИВНЕ ХАРЧУВАННЯ ТА КАЛЬКУЛЯТОР КБЖВ
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
              Мʼязи тренуються в залі, але ростуть на кухні. Розрахуй свою точну потребу в калоріях, білках і воді відповідно до твоєї дисципліни ({userDiscipline || 'Атлет'}).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleArnoNutritionAdvice}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer font-heading"
            >
              <Volume2 className="w-4 h-4" />
              Порада Арно по їжі
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-3 no-scrollbar">
        {[
          { id: 'calculator', label: 'Калькулятор КБЖВ', icon: Calculator },
          { id: 'journal', label: 'Щоденник харчування', icon: Utensils },
          { id: 'timing', label: 'Таймінг прийомів їжі', icon: Clock },
          { id: 'recipes', label: 'Еталонні страви кузні', icon: Apple }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer font-heading ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-900/70 text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CALCULATOR & MACRO TARGETS */}
      {activeTab === 'calculator' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Controls */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-7 space-y-6">
              <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Твої параметри тіла
              </h3>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-neutral-300">Вага тіла</span>
                  <span className="text-amber-400 text-base">{weight} кг</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="140"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                  <span>45 кг</span>
                  <span>75 кг</span>
                  <span>140 кг</span>
                </div>
              </div>

              {/* Height Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-neutral-300">Зріст</span>
                  <span className="text-amber-400 text-base">{height} см</span>
                </div>
                <input
                  type="range"
                  min="145"
                  max="210"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                  <span>145 см</span>
                  <span>178 см</span>
                  <span>210 см</span>
                </div>
              </div>

              {/* Goal Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-300 block">
                  Ціль тренувань
                </label>
                <select
                  value={goal}
                  onChange={(e) => {
                    sound.playClick();
                    setGoal(e.target.value as GoalType);
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="hypertrophy">Набір сухої мʼязової маси (+350 ккал)</option>
                  <option value="recomp">Рельєф і спалювання жиру (-450 ккал)</option>
                  <option value="strength">Максимальна сила (+200 ккал)</option>
                  <option value="endurance">Підтримка ваги та витривалість</option>
                </select>
              </div>

              {/* Activity Multiplier */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-300 block">
                  Інтенсивність щоденної активності
                </label>
                <select
                  value={activityMultiplier}
                  onChange={(e) => {
                    sound.playClick();
                    setActivityMultiplier(parseFloat(e.target.value));
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value={1.375}>Легка (1-2 тренування на тиждень)</option>
                  <option value={1.55}>Помірна (3-4 важких тренування)</option>
                  <option value={1.725}>Висока (5-6 тренувань + активна робота)</option>
                  <option value={1.9}>Екстремальна (2 тренування на день)</option>
                </select>
              </div>

              {/* Water Drinker Tracker Bar */}
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Droplet className="w-4 h-4 fill-cyan-400" />
                    Випито води за сьогодні:
                  </span>
                  <span className="text-white font-heading text-sm">{waterDrunk.toFixed(1)} / {targetWaterLiters} л</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => saveWater(Math.max(0, parseFloat((waterDrunk - 0.25).toFixed(2))))}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 cursor-pointer"
                  >
                    -250 мл
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      saveWater(parseFloat((waterDrunk + 0.25).toFixed(2)));
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    +250 мл (Склянка)
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      saveWater(parseFloat((waterDrunk + 0.5).toFixed(2)));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer"
                  >
                    +500 мл
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Target Dashboard (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Macro Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-3xl bg-neutral-900/90 border border-amber-500/30 p-5 text-center shadow-lg relative overflow-hidden">
                  <span className="text-xs uppercase font-bold text-neutral-400 block">Калорії на добу</span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 font-heading block mt-1">
                    {targetCalories}
                  </span>
                  <span className="text-[11px] text-amber-300/80 font-medium">ккал</span>
                </div>

                <div className="rounded-3xl bg-neutral-900/90 border border-red-500/30 p-5 text-center shadow-lg relative overflow-hidden">
                  <span className="text-xs uppercase font-bold text-neutral-400 block">Білок (Протеїн)</span>
                  <span className="text-3xl sm:text-4xl font-black text-red-400 font-heading block mt-1">
                    {targetProteinGrams} г
                  </span>
                  <span className="text-[11px] text-red-300/80 font-medium">{Math.round(targetProteinGrams * 4)} ккал (~{(targetProteinGrams / weight).toFixed(1)} г/кг)</span>
                </div>

                <div className="rounded-3xl bg-neutral-900/90 border border-yellow-500/30 p-5 text-center shadow-lg relative overflow-hidden">
                  <span className="text-xs uppercase font-bold text-neutral-400 block">Вуглеводи</span>
                  <span className="text-3xl sm:text-4xl font-black text-yellow-400 font-heading block mt-1">
                    {targetCarbsGrams} г
                  </span>
                  <span className="text-[11px] text-yellow-300/80 font-medium">{Math.round(targetCarbsGrams * 4)} ккал (Енергія)</span>
                </div>

                <div className="rounded-3xl bg-neutral-900/90 border border-emerald-500/30 p-5 text-center shadow-lg relative overflow-hidden">
                  <span className="text-xs uppercase font-bold text-neutral-400 block">Корисні Жири</span>
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-heading block mt-1">
                    {targetFatsGrams} г
                  </span>
                  <span className="text-[11px] text-emerald-300/80 font-medium">{Math.round(targetFatsGrams * 9)} ккал (Гормони)</span>
                </div>
              </div>

              {/* Visual Macro Ratio Bar */}
              <div className="rounded-3xl bg-neutral-900/70 border border-neutral-800 p-6 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span>Співвідношення макронутрієнтів у раціоні:</span>
                  <span className="text-amber-400">
                    Б: {Math.round((targetProteinGrams * 4 / targetCalories) * 100)}% / 
                    В: {Math.round((targetCarbsGrams * 4 / targetCalories) * 100)}% / 
                    Ж: {Math.round((targetFatsGrams * 9 / targetCalories) * 100)}%
                  </span>
                </div>

                <div className="h-4 rounded-full bg-neutral-950 overflow-hidden flex shadow-inner">
                  <div 
                    style={{ width: `${(targetProteinGrams * 4 / targetCalories) * 100}%` }}
                    className="bg-red-500 transition-all duration-500" 
                    title="Білки" 
                  />
                  <div 
                    style={{ width: `${(targetCarbsGrams * 4 / targetCalories) * 100}%` }}
                    className="bg-yellow-500 transition-all duration-500" 
                    title="Вуглеводи" 
                  />
                  <div 
                    style={{ width: `${(targetFatsGrams * 9 / targetCalories) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500" 
                    title="Жири" 
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Білок: будова та регенерація мʼязових волокон</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Вуглеводи: відновлення запасів глікогену</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Жири: синтез тестостерону та здоровʼя суглобів</span>
                  </div>
                </div>
              </div>

              {/* Real-world Progress Today vs Target */}
              <div className="rounded-3xl bg-neutral-900/70 border border-neutral-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white font-heading">
                    Зʼїдено за сьогодні (З щоденника):
                  </h4>
                  <span className="text-xs font-bold text-amber-400">
                    {consumedCalories} / {targetCalories} ккал ({Math.round((consumedCalories / targetCalories) * 100)}%)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold block">Білок</span>
                    <span className="text-lg font-bold text-red-400 font-heading">{consumedProtein} / {targetProteinGrams} г</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold block">Вуглеводи</span>
                    <span className="text-lg font-bold text-yellow-400 font-heading">{consumedCarbs} / {targetCarbsGrams} г</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-bold block">Жири</span>
                    <span className="text-lg font-bold text-emerald-400 font-heading">{consumedFats} / {targetFatsGrams} г</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: FOOD LOGGING JOURNAL */}
      {activeTab === 'journal' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form to Add Meal */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-5">
              <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Додати страву
              </h3>

              <form onSubmit={handleAddFood} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Назва страви / продукту
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="наприклад, Філе індички з рисом"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Прийом їжі
                    </label>
                    <select
                      value={newMeal}
                      onChange={(e) => setNewMeal(e.target.value as any)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="breakfast">Сніданок</option>
                      <option value="lunch">Обід</option>
                      <option value="dinner">Вечеря</option>
                      <option value="snack">Перекус</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Вага (грами)
                    </label>
                    <input
                      type="number"
                      value={newGrams}
                      onChange={(e) => setNewGrams(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Ккал
                    </label>
                    <input
                      type="number"
                      value={newCalories}
                      onChange={(e) => setNewCalories(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Білки (г)
                    </label>
                    <input
                      type="number"
                      value={newProtein}
                      onChange={(e) => setNewProtein(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-red-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Вуглеводи (г)
                    </label>
                    <input
                      type="number"
                      value={newCarbs}
                      onChange={(e) => setNewCarbs(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-yellow-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">
                      Жири (г)
                    </label>
                    <input
                      type="number"
                      value={newFats}
                      onChange={(e) => setNewFats(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer font-heading tracking-wide"
                >
                  <Plus className="w-4 h-4" />
                  ЗАПИСАТИ В ЩОДЕННИК
                </button>
              </form>

              {/* Quick Presets Fast Add */}
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <span className="text-xs font-bold uppercase text-neutral-400 block">
                  Швидкий клік-вибір продуктів:
                </span>
                <div className="space-y-1.5">
                  {quickPresets.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPreset(qp)}
                      className="w-full text-left p-2 rounded-xl bg-neutral-950/80 hover:bg-neutral-850 border border-neutral-800 text-xs flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="text-neutral-200 truncate">{qp.name}</span>
                      <span className="text-amber-400 font-bold shrink-0 ml-2">+{qp.c} ккал</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List of Today's Foods */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white font-heading">
                  Прийоми їжі за сьогодні ({logs.length})
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      saveLogs([]);
                    }}
                    className="text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Очистити день
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/40 p-12 text-center text-neutral-400">
                  <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                  <p className="font-semibold text-neutral-300">Щоденник порожній</p>
                  <p className="text-xs mt-1">Додай першу страву з форми або скористайся швидкими кнопками ліворуч.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            item.meal === 'breakfast'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : item.meal === 'lunch'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : item.meal === 'dinner'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}>
                            {item.meal === 'breakfast' ? 'Сніданок' : item.meal === 'lunch' ? 'Обід' : item.meal === 'dinner' ? 'Вечеря' : 'Перекус'}
                          </span>
                          <span className="text-xs text-neutral-400">({item.grams}г)</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white font-heading">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 font-medium">
                          <span className="text-red-400">Б: {item.protein}г</span>
                          <span>•</span>
                          <span className="text-yellow-400">В: {item.carbs}г</span>
                          <span>•</span>
                          <span className="text-emerald-400">Ж: {item.fats}г</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-lg font-extrabold text-amber-400 font-heading">
                          {item.calories} ккал
                        </span>
                        <button
                          onClick={() => handleDeleteFood(item.id)}
                          className="p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Видалити запис"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MEAL TIMING */}
      {activeTab === 'timing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-amber-500/30 bg-neutral-900/80 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                1. До тренування (за 1.5–2 години)
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Складні вуглеводи + легкозасвоюваний білок. Це створює стабільний запас глюкози в крові та мʼязового глікогену без тяжкості в шлунку.
              </p>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-amber-300">
                💡 <strong>Ідеально:</strong> Вівсяна каша з ягодами + омлет або рис з відвареним філе.
              </div>
            </div>

            <div className="rounded-3xl border border-orange-500/30 bg-neutral-900/80 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                2. Після тренування (30–60 хв)
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Час закрити анаболічне вікно! Необхідна порція 25–35г швидкого білка для зупинки катаболізму та швидкі вуглеводи для заповнення запасів глікогену.
              </p>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-orange-300">
                💡 <strong>Ідеально:</strong> Сироватковий ізолят + банан або рис з білою рибою.
              </div>
            </div>

            <div className="rounded-3xl border border-purple-500/30 bg-neutral-900/80 p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">
                3. Перед сном (Нічний захист)
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Повільний міцелярний казеїн або кисломолочний сир живить мʼязові волокна амінокислотами впродовж усіх 8 годин сну, стимулюючи гормон росту.
              </p>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-purple-300">
                💡 <strong>Ідеально:</strong> 200г сиру 5% або казеїновий шейк з мигдалем.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {[
            {
              title: 'Сніданок Титана: Козацька Вівсянка',
              time: '10 хв',
              cals: '580 ккал',
              macros: 'Б: 35г | В: 75г | Ж: 14г',
              ingredients: ['100г вівсяних пластівців', '1 мірна ложка протеїну', '1 банан', '15г мигдалю або арахісової пасти', '1 ч.л. меду'],
              tips: 'Зваріть вівсянку на воді, зніміть з вогню, дайте охолонути до 60°C і вмішайте протеїн.'
            },
            {
              title: 'Обід Залізного Воїна: Філе по-кузнівськи',
              time: '25 хв',
              cals: '640 ккал',
              macros: 'Б: 54г | В: 70г | Ж: 12г',
              ingredients: ['200г курячого філе зі спеціями', '80г сухої гречки або рису', '100г броколі або стручкової квасолі', '1 ст.л. оливкової олії'],
              tips: 'Запікайте філе у фользі, щоб воно залишалося соковитим та ніжним.'
            },
            {
              title: 'Вечеря Рельєфу: Біла Риба з Овочами',
              time: '20 хв',
              cals: '420 ккал',
              macros: 'Б: 44г | В: 22г | Ж: 8г',
              ingredients: ['250г філе минтая, хека або тріски', 'Лимонний сік, перець, розмарин', 'Салат зі свіжих огірків та шпинату', '1 ст.л. лляної олії'],
              tips: 'Максимум чистого білка без важких вуглеводів на ніч.'
            }
          ].map((rec, i) => (
            <div
              key={i}
              className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">{rec.time}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {rec.cals}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white font-heading">
                  {rec.title}
                </h4>
                <div className="text-xs font-semibold text-neutral-300 bg-neutral-950 p-2 rounded-xl border border-neutral-800">
                  {rec.macros}
                </div>
                <div className="space-y-1 text-xs text-neutral-300">
                  <span className="font-bold text-neutral-400 block text-[10px] uppercase">Інгредієнти:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-400">
                    {rec.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-[11px] text-amber-300/90 italic">
                💡 {rec.tips}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
