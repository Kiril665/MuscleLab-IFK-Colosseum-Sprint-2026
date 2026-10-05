import React, { useState } from 'react';
import { Target, Calendar, Award, CheckCircle } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { academyStore } from '../../services/academyStore';

export interface LevelQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (goal: 'mass' | 'weight_loss' | 'strength' | 'health') => void;
}

export const LevelQuizModal: React.FC<LevelQuizModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<number>(1);
  const [goal, setGoal] = useState<'mass' | 'weight_loss' | 'strength' | 'health'>('mass');
  const [experience, setExperience] = useState<'beginner' | 'some' | 'intermediate'>('beginner');
  const [days, setDays] = useState<number>(3);
  const [showResult, setShowResult] = useState<boolean>(false);

  const handleFinish = () => {
    academyStore.submitQuiz({
      goal,
      experience,
      daysPerWeek: days
    });
    setShowResult(true);
  };

  const handleDone = () => {
    onComplete(goal);
    onClose();
    setShowResult(false);
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Визначення твого стартового рівня" maxWidth="md">
      {!showResult ? (
        <div className="flex flex-col gap-5">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2">
            <span>Крок {step} з 3</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full ${s <= step ? 'bg-[#C6FF3D]' : 'bg-white/10'}`}
                />
              ))}
            </div>
          </div>

          {/* Question 1: Goal */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Target size={18} className="text-[#C6FF3D]" />
                <span>1. Яка твоя головна мета тренувань?</span>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {[
                  { id: 'mass', title: 'Набрати якісну м’язову масу', desc: 'Збільшити об’єми, ширину плечей та грудей' },
                  { id: 'weight_loss', title: 'Спалити зайвий жир і підсушитись', desc: 'Зробити рельєф, зменшити талію, підтягнути тіло' },
                  { id: 'strength', title: 'Вибухова сила та витривалість', desc: 'Більше повторень, перемагати в дуелях' },
                  { id: 'health', title: 'Здорове, функціональне тіло', desc: 'Красива постава, енергія, позбутися втоми' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id as typeof goal)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      goal === item.id
                        ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-white'
                        : 'bg-[#1C222B]/60 border-white/5 text-slate-300 hover:bg-[#1C222B]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={() => setStep(2)} className="mt-2">
                Далі: Досвід →
              </Button>
            </div>
          )}

          {/* Question 2: Experience */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Award size={18} className="text-[#C6FF3D]" />
                <span>2. Твій поточний досвід у тренуваннях?</span>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {[
                  { id: 'beginner', title: 'Абсолютний новачок', desc: 'Ніколи серйозно не займався, починаю з нуля' },
                  { id: 'some', title: 'Пробував раніше кілька разів', desc: 'Знаю техніку відтискань, але не маю системи' },
                  { id: 'intermediate', title: 'Маю базову форму', desc: 'Можу відтиснутися 20+ разів або підтягнутися 5 разів' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setExperience(item.id as typeof experience)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      experience === item.id
                        ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-white'
                        : 'bg-[#1C222B]/60 border-white/5 text-slate-300 hover:bg-[#1C222B]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="w-1/3">
                  Назад
                </Button>
                <Button fullWidth onClick={() => setStep(3)}>
                  Далі: Графік →
                </Button>
              </div>
            </div>
          )}

          {/* Question 3: Frequency */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Calendar size={18} className="text-[#C6FF3D]" />
                <span>3. Скільки днів на тиждень готовий тренуватись?</span>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {[
                  { days: 2, title: '2 дні на тиждень', desc: 'Спокійний вхідний темп, акцент на відновлення' },
                  { days: 3, title: '3 дні на тиждень (Золотий стандарт)', desc: 'Оптимальний ріст м’язів за схемою Full-Body через день' },
                  { days: 4, title: '4–5 днів на тиждень', desc: 'Висока інтенсивність, роздільні спліти (верх / низ)' }
                ].map((item) => (
                  <button
                    key={item.days}
                    onClick={() => setDays(item.days)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      days === item.days
                        ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-white'
                        : 'bg-[#1C222B]/60 border-white/5 text-slate-300 hover:bg-[#1C222B]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={() => setStep(2)} className="w-1/3">
                  Назад
                </Button>
                <Button fullWidth onClick={handleFinish}>
                  Завершити тест ⚡
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#C6FF3D]/20 border border-[#C6FF3D] flex items-center justify-center text-[#C6FF3D] mb-4">
            <CheckCircle size={36} />
          </div>
          <h4 className="font-heading text-xl font-bold text-slate-100 mb-1">
            Рівень зафіксовано!
          </h4>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            Твоя індивідуальна траєкторія: {goal === 'mass' ? 'Набір маси' : goal === 'weight_loss' ? 'Схуднення та рельєф' : 'Сила та форма'} • {days} тренування на тиждень.
          </p>

          <div className="w-full bg-[#1C222B] border border-white/10 rounded-xl p-3 mb-5 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Нагорода за тест:</span>
              <span className="font-bold text-[#C6FF3D]">+40 XP</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Титул розблоковано:</span>
              <span className="font-semibold text-white">«Новачок» 🌱</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Рекомендований старт:</span>
              <span className="font-semibold text-white">
                {goal === 'mass' ? 'Блок «Як накачатись»' : 'Блок «Харчування»'}
              </span>
            </div>
          </div>

          <Button fullWidth size="lg" onClick={handleDone}>
            Перейти до навчання
          </Button>
        </div>
      )}
    </Modal>
  );
};
