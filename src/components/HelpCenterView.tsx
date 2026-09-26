import React, { useState } from 'react';
import { HELP_ARTICLES, HelpArticle } from '../data/helpArticles';
import { 
  HelpCircle, 
  Camera, 
  Swords, 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { sound } from '../services/soundEngine';

interface HelpCenterViewProps {
  initialArticle?: HelpArticle | null;
  onNavigateToCamera: () => void;
  onNavigateToBattle: () => void;
  onNavigateToPassport: () => void;
  onBack: () => void;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  initialArticle,
  onNavigateToCamera,
  onNavigateToBattle,
  onNavigateToPassport,
  onBack
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    initialArticle?.id || HELP_ARTICLES[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = HELP_ARTICLES.filter((art) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.body.toLowerCase().includes(q) ||
      art.section.toLowerCase().includes(q) ||
      art.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const activeArticle = HELP_ARTICLES.find(a => a.id === selectedArticleId) || filteredArticles[0] || HELP_ARTICLES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Forge Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
              Довідка та Стандарти Верифікації
            </h1>
          </div>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onNavigateToCamera();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>AI Камера</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onNavigateToBattle();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Swords className="w-4 h-4" />
            <span>60s Бій</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Articles Sidebar & Active Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Articles Index */}
        <div className="md:col-span-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук у довідці..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredArticles.map((art) => {
              const isSelected = activeArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedArticleId(art.id);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                      {art.section}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                  <h3 className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-amber-300' : 'text-neutral-200'}`}>
                    {art.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Article Details */}
        <div className="md:col-span-8">
          {activeArticle ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    {activeArticle.section}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ID: {activeArticle.id}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {activeArticle.title}
                </h2>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {activeArticle.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-6">
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed whitespace-pre-line">
                  {activeArticle.body}
                </p>
              </div>

              {/* Action Banner inside article */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Готові спробувати верифікацію?
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Займіть вихідну позицію перед камерою та виконайте підхід.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onNavigateToCamera();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  Розпочати вправу
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="text-neutral-400 text-sm">Оберіть статтю зі списку ліворуч</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
