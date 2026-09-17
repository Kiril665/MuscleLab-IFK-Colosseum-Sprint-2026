import React, { useState, useEffect } from 'react';
import { WikiArticle, MythFactItem, WikiSection, AcademyCourse, AcademyLesson } from '../types';
import { communityStore } from '../services/communityStore';
import { academyStore } from '../services/academyStore';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import {
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  Search,
  Plus,
  Eye,
  Clock,
  Tag,
  ArrowRight,
  RotateCcw,
  Trophy,
  Brain,
  Share2,
  GraduationCap,
  Award,
  Layers,
  Check
} from 'lucide-react';

interface ForgeEducationProps {
  onEarnXp?: (amount: number) => void;
  initialTab?: 'wiki' | 'academy' | 'myth_fact';
}

export const ForgeEducation: React.FC<ForgeEducationProps> = ({ onEarnXp, initialTab = 'academy' }) => {
  const [activeTab, setActiveTab] = useState<'wiki' | 'academy' | 'myth_fact'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [courses, setCourses] = useState<AcademyCourse[]>(academyStore.getCourses());
  const [selectedSection, setSelectedSection] = useState<WikiSection | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);

  // Academy Interactive State
  const [activeCourse, setActiveCourse] = useState<AcademyCourse | null>(null);
  const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // New Article Form
  const [newTitle, setNewTitle] = useState('');
  const [newSection, setNewSection] = useState<WikiSection>('exercises');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('біомеханіка, техніка');

  // Myth or Fact Quiz State
  const [mythFacts, setMythFacts] = useState<MythFactItem[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<'MYTH' | 'FACT' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    const update = () => {
      setArticles(communityStore.getWikiArticles());
      setMythFacts(communityStore.getMythFacts());
    };
    update();
    const unsub = communityStore.subscribe(update);
    return () => unsub();
  }, []);

  const sectionLabels: Record<WikiSection, { title: string; icon: string }> = {
    exercises: { title: 'Вправи & Біомеханіка', icon: '🏋️' },
    training: { title: 'Методика Тренувань', icon: '📈' },
    calisthenics: { title: 'Калістеніка & Власна Вага', icon: '🤸' },
    bodybuilding: { title: 'Бодибілдинг & Залізо', icon: '💪' },
    nutrition: { title: 'Спортивне Харчування', icon: '🥗' },
    recovery: { title: 'Відновлення & Сон', icon: '🛌' },
    equipment: { title: 'Обладнання & Екіпірування', icon: '⛓️' },
    terms: { title: 'Спортивні Терміни', icon: '📖' },
    technique: { title: 'Техніка Рухів', icon: '🎯' }
  };

  const filteredArticles = articles.filter((a) => {
    const matchesSection = selectedSection === 'all' || a.section === selectedSection;
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const handleOpenArticle = (art: WikiArticle) => {
    sound.playClick();
    communityStore.markWikiArticleRead(art.id);
    setSelectedArticle(art);
    if (onEarnXp && !art.isReadByMe) {
      onEarnXp(25);
    }
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArr = newTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const created = communityStore.addWikiArticle(
      newTitle.trim(),
      newSection,
      newSummary.trim() || newTitle.trim(),
      newContent.trim(),
      tagsArr.length > 0 ? tagsArr : ['знання']
    );

    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setShowAddArticleModal(false);
    setSelectedArticle(created);
    if (onEarnXp) onEarnXp(100);
  };

  // Myth or Fact Quiz handlers
  const currentMythItem = mythFacts[currentQuizIndex];

  const handleAnswer = (choice: 'MYTH' | 'FACT') => {
    if (userAnswer !== null || !currentMythItem) return;
    setUserAnswer(choice);

    const isCorrect = (choice === 'MYTH' && currentMythItem.isMyth) || (choice === 'FACT' && !currentMythItem.isMyth);

    if (isCorrect) {
      sound.playLevelUp();
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      arnoVoice.speak('Точно в ціль! Справжнє наукове розуміння.');
      if (onEarnXp) onEarnXp(30);
    } else {
      sound.playClick();
      setStreak(0);
      arnoVoice.speak('Не зовсім так! Але тепер ти знаєш істину.');
    }
  };

  const handleNextQuiz = () => {
    setUserAnswer(null);
    if (currentQuizIndex + 1 < mythFacts.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
      sound.playTrophy();
      arnoVoice.speak(`Вікторину завершено! Твій результат: ${score + (userAnswer ? 0 : 0)} з ${mythFacts.length}.`);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setUserAnswer(null);
    setScore(0);
    setStreak(0);
    setQuizCompleted(false);
    sound.playClick();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-blue-950/40 border border-blue-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-blue-400" />
                Forge Education • База Знань та Вікторини
              </span>
              <span className="text-xs text-neutral-400">
                LEARN → MASTER → APPLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-wide">
              FORGE WIKI & MYTH OR FACT
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
              Спільна бібліотека спортивної науки ForgeMuscle: вивчай біомеханіку вправ, розвінчуй міфи та ділися власними статтями.
            </p>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/90 border border-blue-500/30 shrink-0 overflow-x-auto">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('academy');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'academy'
                  ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Forge Academy 🎓</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('wiki');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'wiki'
                  ? 'bg-blue-500 text-neutral-950 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Forge Wiki 📚</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('myth_fact');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'myth_fact'
                  ? 'bg-blue-500 text-neutral-950 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>Myth or Fact 🧠</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== TAB 0: FORGE ACADEMY ==================== */}
      {activeTab === 'academy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                Освітні Курси з Інтерактивними Тестами
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Короткі практичні уроки: анатомія, техніка, прогрес, сон і нутрієнти. Кожен урок має 3 перевірочні запитання.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl">
              Курсів: {courses.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const totalLessons = course.lessons.length;
              const completed = course.lessons.filter((l) => l.isCompleted).length;
              const percent = Math.round((completed / totalLessons) * 100) || 0;

              return (
                <div
                  key={course.id}
                  className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl p-2 rounded-2xl bg-neutral-950 border border-neutral-800">{course.icon}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
                        {course.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-100">{course.title}</h3>
                    <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{course.description}</p>

                    <div className="mt-4 pt-3 border-t border-neutral-800">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span>Пройдено уроків:</span>
                        <span className="font-bold text-amber-400">{completed} / {totalLessons}</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setActiveCourse(course);
                        setActiveLesson(course.lessons[0]);
                        setSelectedQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
                    >
                      Відкрити курс
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 1: FORGE WIKI ==================== */}
      {activeTab === 'wiki' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук статті, біомеханіки або терміну..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowAddArticleModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-heading"
            >
              <Plus className="w-4 h-4" />
              Запропонувати статтю (+40 Rep XP)
            </button>
          </div>

          {/* Sections Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            <button
              onClick={() => setSelectedSection('all')}
              className={`p-3 rounded-2xl text-xs font-bold transition-all text-center border cursor-pointer ${
                selectedSection === 'all'
                  ? 'bg-blue-500 text-neutral-950 border-blue-400 font-extrabold shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              📚 Усі розділи
            </button>
            {(Object.keys(sectionLabels) as WikiSection[]).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`p-3 rounded-2xl text-xs font-semibold transition-all text-center border cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-blue-500 text-neutral-950 border-blue-400 font-extrabold shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block text-base mb-0.5">{sectionLabels[sec].icon}</span>
                <span className="truncate block">{sectionLabels[sec].title.split('&')[0]}</span>
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                onClick={() => handleOpenArticle(art)}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/80 hover:border-blue-500/50 p-6 space-y-4 cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1.5">
                      {sectionLabels[art.section]?.icon} {sectionLabels[art.section]?.title}
                    </span>
                    <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.readTimeMinutes} хв
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white font-heading group-hover:text-blue-400 transition-colors">
                    {art.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500">Автор: <strong className="text-neutral-300">{art.authorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-xs font-bold group-hover:translate-x-1 transition-transform">
                    <span>Читати</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MYTH OR FACT ==================== */}
      {activeTab === 'myth_fact' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {!quizCompleted && currentMythItem ? (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Quiz Progress & Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 font-bold">
                    Питання {currentQuizIndex + 1} з {mythFacts.length}
                  </span>
                  <div className="w-24 h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${((currentQuizIndex + 1) / mythFacts.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    Серія: {streak}
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    Рахунок: {score}
                  </span>
                </div>
              </div>

              {/* Question Statement Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-4">
                <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 inline-block">
                  {currentMythItem.category === 'nutrition'
                    ? '🥗 Харчування'
                    : currentMythItem.category === 'recovery'
                    ? '🛌 Відновлення'
                    : currentMythItem.category === 'anatomy'
                    ? '🦴 Анатомія'
                    : '🏋️ Тренування'}
                </span>

                <h2 className="text-lg sm:text-2xl font-bold text-white font-heading leading-snug">
                  «{currentMythItem.statement}»
                </h2>

                <p className="text-xs text-neutral-500">
                  Міф чи підтверджений науковий факт? Твій вибір:
                </p>
              </div>

              {/* Action Buttons: MYTH vs FACT */}
              {userAnswer === null ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer('MYTH')}
                    className="py-4 rounded-2xl bg-red-950/40 hover:bg-red-600 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white font-extrabold text-base sm:text-lg transition-all cursor-pointer shadow-lg font-heading active:scale-95"
                  >
                    ❌ ЦЕ МІФ (MYTH)
                  </button>

                  <button
                    onClick={() => handleAnswer('FACT')}
                    className="py-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 hover:text-white font-extrabold text-base sm:text-lg transition-all cursor-pointer shadow-lg font-heading active:scale-95"
                  >
                    ✅ ЦЕ ФАКТ (FACT)
                  </button>
                </div>
              ) : (
                /* Reveal Answer & Scientific Explanation */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div
                    className={`p-5 rounded-2xl border ${
                      (userAnswer === 'MYTH' && currentMythItem.isMyth) || (userAnswer === 'FACT' && !currentMythItem.isMyth)
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-red-950/40 border-red-500 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-base sm:text-lg mb-2">
                      {(userAnswer === 'MYTH' && currentMythItem.isMyth) || (userAnswer === 'FACT' && !currentMythItem.isMyth) ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>Правильно! +30 XP</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span>Невірно! Але це цінний урок знань.</span>
                        </>
                      )}
                    </div>

                    <p className="font-extrabold text-sm text-white mb-2">
                      {currentMythItem.shortFact}
                    </p>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {currentMythItem.scientificExplanation}
                    </p>

                    <div className="mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
                      <span>Джерело: {currentMythItem.source}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuiz}
                    className="w-full py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-neutral-950 font-extrabold text-sm sm:text-base transition-all cursor-pointer font-heading shadow-md flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentQuizIndex + 1 < mythFacts.length ? 'Наступне запитання' : 'Переглянути результати'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Screen */
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/40 mx-auto flex items-center justify-center text-4xl shadow-lg">
                🏆
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
                  ВІКТОРИНУ ЗАВЕРШЕНО!
                </h2>
                <p className="text-sm text-neutral-400 max-w-md mx-auto">
                  Твій результат: <strong className="text-white text-base">{score} з {mythFacts.length}</strong> правильних відповідей.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 max-w-sm mx-auto flex items-center justify-around">
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Отримано XP</span>
                  <span className="text-xl font-bold text-amber-400 font-heading">+{score * 30} XP</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block uppercase font-bold">Репутація</span>
                  <span className="text-xl font-bold text-blue-400 font-heading">+{score * 5} Rep</span>
                </div>
              </div>

              <button
                onClick={handleRestartQuiz}
                className="px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold text-sm transition-all cursor-pointer font-heading inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Пройти знову
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== ARTICLE READER MODAL ==================== */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-blue-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                  {sectionLabels[selectedArticle.section]?.icon} {sectionLabels[selectedArticle.section]?.title}
                </span>
                <span className="text-xs text-neutral-400">
                  Автор: <strong className="text-white">{selectedArticle.authorName}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-neutral-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                {selectedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-neutral-400 italic bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                {selectedArticle.summary}
              </p>

              <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line space-y-3">
                {selectedArticle.content}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-800">
                {selectedArticle.tags.map((t, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-blue-500 text-neutral-950 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD ARTICLE MODAL ==================== */}
      {showAddArticleModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-blue-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                ЗАПРОПОНУВАТИ СТАТТЮ ДО FORGE WIKI
              </h3>
              <button
                onClick={() => setShowAddArticleModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Назва матеріалу</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Наприклад: Біомеханіка нахилу штанги в тязі до поясу..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Розділ Wiki</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value as WikiSection)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                >
                  {(Object.keys(sectionLabels) as WikiSection[]).map((sec) => (
                    <option key={sec} value={sec}>{sectionLabels[sec].title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Короткий опис (Summary)</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="1-2 речення про суть та практичну користь..."
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Повний текст статті</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Розкрий кроки, помилки, анатомічні нюанси та поради..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Теги</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="тяга, спина, безпека"
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddArticleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-500 text-neutral-950 font-extrabold text-xs sm:text-sm hover:bg-blue-400 transition-all cursor-pointer font-heading"
                >
                  ОПУБЛІКУВАТИ (+40 Rep XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ACADEMY LESSON & QUIZ MODAL ==================== */}
      {activeCourse && activeLesson && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-neutral-950 border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeCourse.icon}</span>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 font-mono block">
                    {activeCourse.title}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-100">
                    {activeLesson.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveCourse(null);
                  setActiveLesson(null);
                }}
                className="text-neutral-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Lesson Navigation pills if multiple lessons */}
            {activeCourse.lessons.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeCourse.lessons.map((les, idx) => (
                  <button
                    key={les.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveLesson(les);
                      setSelectedQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeLesson.id === les.id
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    Урок {idx + 1}: {les.title.slice(0, 25)}...
                  </button>
                ))}
              </div>
            )}

            {/* Lesson Content */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs text-amber-300 italic">
                💡 {activeLesson.summary}
              </div>

              <div className="space-y-2.5">
                {activeLesson.content.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3-Question Quiz Section */}
            <div className="mt-8 pt-6 border-t border-neutral-800 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Перевірка Знань (Тест)
                </h4>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  +{activeLesson.xpReward} XP
                </span>
              </div>

              <div className="space-y-6">
                {activeLesson.quiz.map((q, qIdx) => {
                  const selectedOpt = selectedQuizAnswers[q.id];
                  const isAnswered = selectedOpt !== undefined;

                  return (
                    <div key={q.id} className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                      <p className="text-xs font-bold text-neutral-200">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isChosen = selectedOpt === optIdx;
                          let btnStyle = 'border-neutral-800 bg-neutral-950/70 text-neutral-300 hover:border-amber-500/40';

                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) {
                              btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold';
                            } else if (isChosen) {
                              btnStyle = 'border-red-500 bg-red-950/40 text-red-300';
                            }
                          } else if (isChosen) {
                            btnStyle = 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => {
                                sound.playClick();
                                setSelectedQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation if submitted */}
                      {quizSubmitted && (
                        <div className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-800/60">
                          <span className="font-bold text-amber-400">Пояснення: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit / Finish buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                {!quizSubmitted ? (
                  <button
                    onClick={() => {
                      setQuizSubmitted(true);
                      sound.playTrophy();
                      const xpEarned = academyStore.completeLesson(activeCourse.id, activeLesson.id);
                      if (onEarnXp && xpEarned > 0) {
                        onEarnXp(xpEarned);
                      }
                    }}
                    disabled={Object.keys(selectedQuizAnswers).length < activeLesson.quiz.length}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                  >
                    Перевірити відповіді
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveCourse(null);
                      setActiveLesson(null);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
                  >
                    Завершити урок
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
