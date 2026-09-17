import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Dumbbell, 
  BookOpen, 
  GraduationCap, 
  MessageSquare, 
  Target, 
  Flame, 
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { EXERCISES } from '../data/exercisesData';
import { communityStore } from '../services/communityStore';
import { academyStore } from '../services/academyStore';
import { Exercise } from '../types';
import { sound } from '../services/soundEngine';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemData?: any) => void;
}

type SearchCategory = 'all' | 'exercises' | 'wiki' | 'academy' | 'community' | 'challenges';

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const wikiArticles = useMemo(() => communityStore.getWikiArticles(), []);
  const academyCourses = useMemo(() => academyStore.getCourses(), []);
  const posts = useMemo(() => communityStore.getPosts(), []);
  const questions = useMemo(() => communityStore.getQuestions(), []);
  const challenges = useMemo(() => communityStore.getWeeklyChallenges(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { exercises: [], wiki: [], academy: [], community: [], challenges: [] };

    // Search exercises
    const matchedExercises = EXERCISES.filter((ex) => 
      ex.name.toLowerCase().includes(q) ||
      ex.muscle.toLowerCase().includes(q) ||
      ex.location.toLowerCase().includes(q) ||
      ex.discipline.toLowerCase().includes(q) ||
      (ex.description && ex.description.toLowerCase().includes(q)) ||
      (ex.techniqueGood && ex.techniqueGood.some(t => t.toLowerCase().includes(q))) ||
      (ex.tips && ex.tips.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Wiki
    const matchedWiki = wikiArticles.filter((art) =>
      art.title.toLowerCase().includes(q) ||
      art.section.toLowerCase().includes(q) ||
      art.tags.some(t => t.toLowerCase().includes(q)) ||
      art.paragraphs.some(p => p.toLowerCase().includes(q))
    ).slice(0, 5);

    // Search Academy
    const matchedAcademy = academyCourses.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.lessons.some(l => l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q))
    ).slice(0, 4);

    // Search Community
    const matchedPosts = posts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedQuestions = questions.filter((qu) =>
      qu.title.toLowerCase().includes(q) ||
      qu.details.toLowerCase().includes(q) ||
      qu.tags.some(t => t.toLowerCase().includes(q))
    ).slice(0, 3);

    // Search Challenges
    const matchedChallenges = challenges.filter((ch) =>
      ch.title.toLowerCase().includes(q) ||
      ch.description.toLowerCase().includes(q) ||
      ch.category.toLowerCase().includes(q)
    ).slice(0, 3);

    return {
      exercises: matchedExercises,
      wiki: matchedWiki,
      academy: matchedAcademy,
      community: [...matchedPosts, ...matchedQuestions],
      challenges: matchedChallenges
    };
  }, [query, wikiArticles, academyCourses, posts, questions, challenges]);

  const totalResultsCount = 
    results.exercises.length + 
    results.wiki.length + 
    results.academy.length + 
    results.community.length + 
    results.challenges.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative p-4 sm:p-5 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Єдиний пошук по ForgeMuscle (вправи, академія, гайди, квести)..."
            className="w-full bg-transparent text-white text-base sm:text-lg placeholder-neutral-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-400 text-xs hover:text-white font-mono"
          >
            ESC
          </button>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800/80 overflow-x-auto no-scrollbar text-xs">
          <span className="text-neutral-500 font-medium mr-1 shrink-0">Фільтр:</span>
          {(['all', 'exercises', 'academy', 'wiki', 'community', 'challenges'] as SearchCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-lg font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {cat === 'all' && 'Усі категорії'}
              {cat === 'exercises' && 'Вправи'}
              {cat === 'academy' && 'Академія'}
              {cat === 'wiki' && 'Wiki & Гайди'}
              {cat === 'community' && 'Спільнота'}
              {cat === 'challenges' && 'Челенджі'}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {!query.trim() ? (
            <div className="text-center py-10 space-y-3">
              <Sparkles className="w-8 h-8 text-amber-500/60 mx-auto animate-pulse" />
              <div className="text-sm font-bold text-neutral-300">Введіть будь-який запит для смарт-пошуку</div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Приклади: «підтягування», «спина», «віджимання», «прогресивне перевантаження», «креатин», «челендж»
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Підтягування', 'Бруси', 'Груди', 'Гіпертрофія', 'Гайд на вихід'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setQuery(sample)}
                    className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="text-center py-12 text-neutral-500 space-y-2">
              <p className="text-sm">За запитом «{query}» нічого не знайдено.</p>
              <p className="text-xs text-neutral-600">Спробуйте змінити ключові слова або категорію.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Exercises */}
              {(selectedCategory === 'all' || selectedCategory === 'exercises') && results.exercises.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Dumbbell className="w-3.5 h-3.5" />
                    База Вправ ({results.exercises.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => {
                          sound.playClick();
                          onNavigate('exercises', ex);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/60 transition-all cursor-pointer group flex items-start justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {ex.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                            <span className="capitalize">{ex.muscle}</span>
                            <span>•</span>
                            <span className="capitalize">{ex.difficulty}</span>
                            <span>•</span>
                            <span className="text-amber-400">+{ex.xpPerRep} XP/rep</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academy */}
              {(selectedCategory === 'all' || selectedCategory === 'academy') && results.academy.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Forge Academy ({results.academy.length})
                  </div>
                  <div className="space-y-2">
                    {results.academy.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => {
                          sound.playClick();
                          onNavigate('academy', course);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-800/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{course.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {course.title}
                            </div>
                            <div className="text-[11px] text-neutral-400 line-clamp-1">
                              {course.description}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wiki */}
              {(selectedCategory === 'all' || selectedCategory === 'wiki') && results.wiki.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    Forge Wiki & Гайди ({results.wiki.length})
                  </div>
                  <div className="space-y-2">
                    {results.wiki.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => {
                          sound.playClick();
                          onNavigate('wiki', art);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-emerald-500/50 hover:bg-neutral-800/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                            <span>{art.title}</span>
                            {art.isVerified && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                            {art.paragraphs[0]}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Community */}
              {(selectedCategory === 'all' || selectedCategory === 'community') && results.community.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Спільнота ({results.community.length})
                  </div>
                  <div className="space-y-2">
                    {results.community.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          sound.playClick();
                          onNavigate('community', item);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-800/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                            {item.content || item.details}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-blue-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenges */}
              {(selectedCategory === 'all' || selectedCategory === 'challenges') && results.challenges.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
                    <Target className="w-3.5 h-3.5" />
                    Квести та Челенджі ({results.challenges.length})
                  </div>
                  <div className="space-y-2">
                    {results.challenges.map((ch) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          sound.playClick();
                          onNavigate('challenges', ch);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-orange-500/50 hover:bg-neutral-800/60 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                            {ch.title}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            +{ch.xpReward} XP • {ch.category}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-orange-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Єдиний інтелектуальний індекс ForgeMuscle</span>
          <span>Натисніть ESC для закриття</span>
        </div>
      </div>
    </div>
  );
};
