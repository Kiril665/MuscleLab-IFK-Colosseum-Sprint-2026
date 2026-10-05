import React from 'react';
import { BookOpen, Check, Award, Clock } from 'lucide-react';
import { LearningCard } from '../../data/academyData';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { academyStore } from '../../services/academyStore';

export interface LearningCardModalProps {
  card: LearningCard | null;
  isOpen: boolean;
  onClose: () => void;
  isRead: boolean;
}

export const LearningCardModal: React.FC<LearningCardModalProps> = ({
  card,
  isOpen,
  onClose,
  isRead
}) => {
  if (!card) return null;

  const handleMarkAsLearned = () => {
    academyStore.markCardAsRead(card.id, card.xpReward);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card.title} maxWidth="md">
      <div className="flex flex-col gap-4 text-sm">
        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>{card.readTime} читання</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C6FF3D] font-semibold">
            <Award size={14} />
            <span>+{card.xpReward} XP за засвоєння</span>
          </div>
        </div>

        {/* Summary callout */}
        <div className="bg-[#1C222B] border-l-2 border-[#C6FF3D] p-3 rounded-r-xl text-xs sm:text-sm text-slate-200 italic">
          «{card.summary}»
        </div>

        {/* Content paragraphs */}
        <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {card.content.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Key Takeaways */}
        <div className="bg-[#1C222B]/80 p-3.5 rounded-xl border border-white/5">
          <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen size={14} className="text-[#C6FF3D]" /> Головні висновки:
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {card.keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-[#C6FF3D] font-bold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleMarkAsLearned}
          variant={isRead ? 'secondary' : 'primary'}
          className="mt-2"
        >
          {isRead ? (
            <>
              <Check size={18} className="mr-1.5 text-[#C6FF3D]" />
              Вже засвоєно (+{card.xpReward} XP отримано)
            </>
          ) : (
            <>
              <Check size={18} className="mr-1.5" />
              Засвоїти матеріал (+{card.xpReward} XP)
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
