import React, { useState } from 'react';
import { Flame, Droplet, Dumbbell, PieChart } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export const NutritionCalculator: React.FC = () => {
  const [weight, setWeight] = useState<number>(75);
  const [height, setHeight] = useState<number>(178);
  const [age, setAge] = useState<number>(23);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activity, setActivity] = useState<number>(1.375); // moderate
  const [goal, setGoal] = useState<'mass' | 'weight_loss' | 'maintenance'>('mass');

  // Mifflin-St Jeor Formula
  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = Math.round(bmr * activity);

  let targetCalories = tdee;
  if (goal === 'mass') targetCalories = Math.round(tdee + 350);
  if (goal === 'weight_loss') targetCalories = Math.round(tdee - 450);

  // Protein: 1.8g to 2.0g per kg of bodyweight
  const targetProteinGrams = Math.round(weight * (goal === 'mass' ? 2.0 : 1.8));
  // Fats: 0.9g per kg
  const targetFatGrams = Math.round(weight * 0.9);
  // Remainder in Carbs (1g carb = 4 kcal, 1g protein = 4 kcal, 1g fat = 9 kcal)
  const remainingKcal = Math.max(0, targetCalories - (targetProteinGrams * 4 + targetFatGrams * 9));
  const targetCarbsGrams = Math.round(remainingKcal / 4);

  // Water: ~35ml per kg
  const targetWaterLiters = ((weight * 35) / 1000).toFixed(1);

  return (
    <Card variant="default" padding="md" className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h4 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
            <Flame size={18} className="text-[#C6FF3D]" />
            Калькулятор калорій, білка та макронутрієнтів
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Розраховано за науковою формулою Mifflin-St Jeor
          </p>
        </div>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Стать</label>
          <div className="flex bg-[#1C222B] rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setGender('male')}
              className={`flex-1 py-1.5 rounded-lg font-medium cursor-pointer ${
                gender === 'male' ? 'bg-[#C6FF3D] text-[#0B0D10] font-bold' : 'text-slate-400'
              }`}
            >
              Чол
            </button>
            <button
              onClick={() => setGender('female')}
              className={`flex-1 py-1.5 rounded-lg font-medium cursor-pointer ${
                gender === 'female' ? 'bg-[#C6FF3D] text-[#0B0D10] font-bold' : 'text-slate-400'
              }`}
            >
              Жін
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Вага: {weight} кг</label>
          <input
            type="range"
            min={45}
            max={130}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full accent-[#C6FF3D] cursor-pointer"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Зріст: {height} см</label>
          <input
            type="range"
            min={140}
            max={210}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full accent-[#C6FF3D] cursor-pointer"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Вік: {age} р.</label>
          <input
            type="range"
            min={14}
            max={65}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-[#C6FF3D] cursor-pointer"
          />
        </div>
      </div>

      {/* Goal selection */}
      <div>
        <label className="text-xs text-slate-400 block mb-1.5">Твоя поточна ціль</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'mass', label: 'Набір маси (+350 ккал)' },
            { id: 'maintenance', label: 'Підтримка (баланс)' },
            { id: 'weight_loss', label: 'Схуднення (-450 ккал)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setGoal(item.id as typeof goal)}
              className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                goal === item.id
                  ? 'bg-[#C6FF3D]/15 border-[#C6FF3D] text-[#C6FF3D]'
                  : 'bg-[#1C222B]/60 border-white/5 text-slate-300 hover:bg-[#1C222B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="bg-[#1C222B] p-3 rounded-xl border border-white/5 text-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Flame size={12} className="text-amber-400" /> Калорії
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold text-white">
            {targetCalories}
          </div>
          <div className="text-[10px] text-slate-400">ккал / добу</div>
        </div>

        <div className="bg-[#1C222B] p-3 rounded-xl border border-white/5 text-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Dumbbell size={12} className="text-[#C6FF3D]" /> Білок
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold text-[#C6FF3D]">
            {targetProteinGrams} г
          </div>
          <div className="text-[10px] text-slate-400">~2.0 г/кг маси</div>
        </div>

        <div className="bg-[#1C222B] p-3 rounded-xl border border-white/5 text-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <PieChart size={12} className="text-sky-400" /> Жири / Вугл.
          </div>
          <div className="font-heading text-lg sm:text-xl font-bold text-white">
            {targetFatGrams}г / {targetCarbsGrams}г
          </div>
          <div className="text-[10px] text-slate-400">для енергії та гормонів</div>
        </div>

        <div className="bg-[#1C222B] p-3 rounded-xl border border-white/5 text-center">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Droplet size={12} className="text-cyan-400" /> Вода
          </div>
          <div className="font-heading text-xl sm:text-2xl font-bold text-cyan-300">
            {targetWaterLiters} л
          </div>
          <div className="text-[10px] text-slate-400">чистої води на день</div>
        </div>
      </div>
    </Card>
  );
};
