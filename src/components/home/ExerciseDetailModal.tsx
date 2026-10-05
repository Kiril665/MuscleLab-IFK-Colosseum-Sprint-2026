import React from 'react';
import { CheckCircle2, AlertTriangle, Wind, Swords } from 'lucide-react';
import { Exercise } from '../../types';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onStartInBattle: (exerciseId: Exercise['id']) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen,
  onClose,
  onStartInBattle
}) => {
  if (!exercise) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exercise.name} maxWidth="lg">
      <div className="flex flex-col gap-5 text-sm">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="accent">
            {exercise.level === 'beginner' ? 'Новачок' : exercise.level === 'intermediate' ? 'Середній' : 'Просунутий'}
          </Badge>
          <Badge variant="neutral">
            {exercise.equipment === 'none' ? 'Власна вага' : exercise.equipment === 'pullup_bar' ? 'Турнік' : 'Гантелі'}
          </Badge>
          {exercise.supportedByCamera && (
            <Badge variant="success">✓ ШІ-камера підтримує</Badge>
          )}
        </div>

        {/* Target Muscles */}
        <div className="bg-[#1C222B]/70 p-3.5 rounded-xl border border-white/5">
          <div className="text-xs text-slate-400 font-medium mb-1">Працюючі м’язи:</div>
          <div className="text-sm font-semibold text-slate-100">{exercise.muscleTarget}</div>
        </div>

        {/* Steps */}
        <div>
          <h4 className="font-heading font-semibold text-slate-200 mb-2.5 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#C6FF3D]" />
            Техніка виконання по кроках:
          </h4>
          <ol className="space-y-2 text-xs sm:text-sm text-slate-300">
            {exercise.steps.map((step, idx) => (
              <li key={idx} className="flex gap-2.5">
                <span className="font-bold text-[#C6FF3D] shrink-0">{idx + 1}.</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Common Mistakes */}
        <div>
          <h4 className="font-heading font-semibold text-red-400 mb-2.5 flex items-center gap-2">
            <AlertTriangle size={16} />
            3 типові помилки новачків:
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {exercise.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="flex gap-2.5 bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span className="leading-relaxed">{mistake}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Breathing */}
        <div className="bg-[#1C222B]/50 p-3 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1">
            <Wind size={14} /> Правильне дихання:
          </div>
          <div>• {exercise.breathing.inhale}</div>
          <div>• {exercise.breathing.exhale}</div>
        </div>

        {/* CTA */}
        {exercise.supportedByCamera && (
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              onClose();
              onStartInBattle(exercise.id);
            }}
            className="mt-1"
          >
            <Swords size={18} className="mr-2" />
            Спробувати в Battle
          </Button>
        )}
      </div>
    </Modal>
  );
};
