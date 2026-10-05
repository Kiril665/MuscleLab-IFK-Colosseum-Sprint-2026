import React, { useState } from 'react';
import { Apple, Utensils, ShieldCheck } from 'lucide-react';
import { Card } from '../../ui/Card';
import { MEAL_PLANS } from '../../data/academyData';

export const PlateRuleVisualizer: React.FC = () => {
  const [activePlanKey, setActivePlanKey] = useState<'mass' | 'weight_loss' | 'maintenance'>('mass');
  const currentPlan = MEAL_PLANS[activePlanKey];

  return (
    <div className="flex flex-col gap-4">
      {/* Plate Rule Graphic */}
      <Card variant="default" padding="md" className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-[#C6FF3D]" />
            <h4 className="font-heading font-bold text-sm sm:text-base text-slate-100">
              Золоте правило тарілки
            </h4>
          </div>
          <span className="text-xs text-slate-400">Формула кожного прийому їжі</span>
        </div>

        {/* Visual plate diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
            <div className="font-bold text-sm text-emerald-400 mb-1">50% — Овочі та клітковина</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Свіжі салати, томати, огірки, броколі, зелень. Насичення вітамінами та легке травлення без зайвих калорій.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#C6FF3D]/10 border border-[#C6FF3D]/30 text-white">
            <div className="font-bold text-sm text-[#C6FF3D] mb-1">25% — Чистий білок</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Куряче філе, риба, яйця, кисломолочний сир, тофу, яловичина. Будівельний цемент для росту мікрофібрил.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <div className="font-bold text-sm text-amber-400 mb-1">25% — Складні вуглеводи</div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Гречка, бурий рис, вівсянка, запечена картопля, цільнозернові макарони. Забезпечують глікоген для 60с дуелей.
            </p>
          </div>
        </div>
      </Card>

      {/* Sample Daily Menus */}
      <Card variant="default" padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Apple size={18} className="text-[#C6FF3D]" />
            <h4 className="font-heading font-bold text-sm sm:text-base text-slate-100">
              Приклад збалансованого меню на день
            </h4>
          </div>
        </div>

        {/* Meal plan tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'mass', label: 'Набір маси' },
            { id: 'weight_loss', label: 'Схуднення' },
            { id: 'maintenance', label: 'Підтримка' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePlanKey(item.id as typeof activePlanKey)}
              className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                activePlanKey === item.id
                  ? 'bg-[#C6FF3D] text-[#0B0D10] border-[#C6FF3D]'
                  : 'bg-[#1C222B] text-slate-300 border-white/5 hover:bg-[#252C38]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Plan summary badge */}
        <div className="flex items-center justify-between bg-[#1C222B]/70 p-2.5 rounded-xl border border-white/5 text-xs">
          <span className="font-semibold text-slate-200">{currentPlan.title}</span>
          <div className="flex gap-2 font-mono text-[11px]">
            <span className="text-amber-400 font-bold">{currentPlan.caloriesApprox}</span>
            <span className="text-[#C6FF3D] font-bold">{currentPlan.proteinApprox}</span>
          </div>
        </div>

        {/* Meals list */}
        <div className="space-y-2 text-xs">
          {currentPlan.meals.map((meal, idx) => (
            <div key={idx} className="bg-[#1C222B]/40 p-2.5 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-bold text-slate-300 w-24 shrink-0">{meal.name}:</span>
              <span className="text-slate-200 flex-1">{meal.items}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Honest Supplements Brief */}
      <Card variant="subtle" padding="sm" className="flex items-start gap-3 text-xs">
        <ShieldCheck size={20} className="text-[#C6FF3D] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Чесна порада щодо добавок: </span>
          <span className="text-slate-300">
            Для новачка єдині добавки з 100% науковою базою — <strong>Креатин моногідрат (3–5 г/день)</strong> та <strong>Вітамін D3 / Омега-3</strong>. Протеїн купуй лише тоді, коли важко добирати норму білка зі звичайної їжі.
          </span>
        </div>
      </Card>
    </div>
  );
};
