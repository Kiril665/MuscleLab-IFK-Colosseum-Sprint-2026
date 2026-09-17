import React, { useState, useEffect } from 'react';
import { ForgeChat } from './ForgeChat';
import { 
  CommunityPost, 
  AskQuestion, 
  Guild, 
  CommunityCategory, 
  PostType,
  ReputationRank
} from '../types';
import { communityStore, REPUTATION_RANKS } from '../services/communityStore';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';
import {
  MessageSquare,
  Sparkles,
  HelpCircle,
  Users,
  Shield,
  ThumbsUp,
  Plus,
  Trash2,
  Flag,
  UserX,
  Award,
  CheckCircle2,
  Flame,
  Search,
  BookOpen,
  Filter,
  Send,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

interface ForgeCommunityProps {
  onEarnXp?: (amount: number) => void;
  initialTab?: 'feed' | 'ask' | 'guilds' | 'rules' | 'chat';
}

export const ForgeCommunity: React.FC<ForgeCommunityProps> = ({ onEarnXp, initialTab = 'feed' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'ask' | 'guilds' | 'rules' | 'chat'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [questions, setQuestions] = useState<AskQuestion[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [userProfile, setUserProfile] = useState(communityStore.getUserProfile());

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & UI states
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: 'post' | 'comment' | 'question'; title?: string } | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Question details expand
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [newAnswerText, setNewAnswerText] = useState<{ [qId: string]: string }>({});

  // Create Post Form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityCategory>('training');
  const [postType, setPostType] = useState<PostType>('experience');
  const [postTags, setPostTags] = useState('тренування, техніка');

  // Create Question Form
  const [qTitle, setQTitle] = useState('');
  const [qDetails, setQDetails] = useState('');
  const [qCategory, setQCategory] = useState<CommunityCategory>('calisthenics');
  const [qTags, setQTags] = useState('порада, техніка');

  // Load from store
  useEffect(() => {
    const update = () => {
      setPosts(communityStore.getPosts());
      setQuestions(communityStore.getQuestions());
      setGuilds(communityStore.getGuilds());
      setUserProfile(communityStore.getUserProfile());
    };
    update();
    const unsub = communityStore.subscribe(update);
    return () => unsub();
  }, []);

  // Category labels in Ukrainian
  const categoryLabels: Record<CommunityCategory, string> = {
    training: 'Тренування',
    calisthenics: 'Калістеніка',
    bodybuilding: 'Бодибілдинг',
    nutrition: 'Харчування',
    recovery: 'Відновлення',
    equipment: 'Обладнання',
    beginners: 'Новачки',
    motivation: 'Мотивація',
    general: 'Загальне'
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const tagsArr = postTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    communityStore.addPost({
      title: postTitle.trim(),
      content: postContent.trim(),
      category: postCategory,
      type: postType,
      tags: tagsArr.length > 0 ? tagsArr : ['кузня']
    });

    setPostTitle('');
    setPostContent('');
    setShowCreatePostModal(false);
    if (onEarnXp) onEarnXp(50);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qDetails.trim()) return;

    const tagsArr = qTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    communityStore.addQuestion(
      qTitle.trim(),
      qDetails.trim(),
      qCategory,
      tagsArr.length > 0 ? tagsArr : ['питання']
    );

    setQTitle('');
    setQDetails('');
    setShowCreateQuestionModal(false);
    if (onEarnXp) onEarnXp(40);
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;
    communityStore.addComment(postId, text);
    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
    if (onEarnXp) onEarnXp(15);
  };

  const handleAddAnswer = (questionId: string) => {
    const text = newAnswerText[questionId]?.trim();
    if (!text) return;
    communityStore.addAnswer(questionId, text);
    setNewAnswerText((prev) => ({ ...prev, [questionId]: '' }));
    if (onEarnXp) onEarnXp(30);
  };

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    const matchesCat = selectedCategory === 'all' || q.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Reputation Status */}
      <div className="relative rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Спільнота Кузні • Brotherhood of Steel
              </span>
              <span className="text-xs text-neutral-400">
                TRAIN → LEVEL UP → SHARE
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-wide">
              FORGE COMMUNITY & Q&A
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
              Ділися перевіреним досвідом, став запитання наставникам, отримуй статус «Best Answer» та підіймай репутацію свого братства.
            </p>
          </div>

          {/* User Reputation Card */}
          <div className="rounded-2xl bg-neutral-900/90 border border-amber-500/40 p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-md">
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Твій ранг:</span>
                <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {userProfile.reputationRank}
                </span>
              </div>
              <div className="text-xl font-extrabold text-white font-heading flex items-center gap-1.5 mt-0.5">
                <Award className="w-5 h-5 text-amber-400" />
                <span>{userProfile.reputationPoints} Rep XP</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {userProfile.guildName ? `Гільдія: ${userProfile.guildName}` : 'Без гільдії'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-neutral-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('feed');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'feed'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Стрічка досвіду & Гайди</span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-950/40 text-[11px]">{posts.length}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('ask');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'ask'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ask the Forge (Q&A)</span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-950/40 text-[11px]">{questions.length}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('guilds');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'guilds'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Forge Guilds (Гільдії)</span>
            <span className="px-1.5 py-0.2 rounded bg-neutral-950/40 text-[11px]">{guilds.length}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('chat');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Forge Chat (Кімнати & Чат)</span>
            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">LIVE</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('rules');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'rules'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Кодекс Честі & Модерація</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-TAB 1: FEED ==================== */}
      {activeSubTab === 'feed' && (
        <div className="space-y-6">
          {/* Action Bar: Search, Category pills, and Create Post button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук гайдів, технік або авторів..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowCreatePostModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Створити публікацію (+15 Rep XP)
            </button>
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-extrabold'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Всі теми
            </button>
            {(Object.keys(categoryLabels) as CommunityCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-neutral-950 font-extrabold'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-16 bg-neutral-900/40 rounded-3xl border border-neutral-800">
                <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Дописів не знайдено</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Будь першим, хто поділиться своїм досвідом у цій категорії!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`rounded-3xl border bg-neutral-900/80 p-5 sm:p-6 space-y-4 transition-all ${
                    post.isPinned ? 'border-amber-500/50 bg-gradient-to-b from-neutral-900 to-amber-950/20' : 'border-neutral-800'
                  }`}
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-neutral-700 shrink-0">
                        <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{post.authorName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {post.authorRank}
                          </span>
                          {post.isPinned && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/40 flex items-center gap-1">
                              📌 Закріплено
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(post.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Post Actions: Report, Delete if mine, Block */}
                    <div className="flex items-center gap-1">
                      {post.authorId === userProfile.id ? (
                        <button
                          onClick={() => communityStore.deletePost(post.id)}
                          title="Видалити власний допис"
                          className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setReportTarget({ id: post.id, type: 'post', title: post.title })}
                            title="Поскаржитися на допис"
                            className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => communityStore.blockUser(post.authorId, post.authorName)}
                            title="Заблокувати цього автора"
                            className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Post Title & Content */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      #{categoryLabels[post.category]}
                    </span>
                    {post.tags.map((t, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Post Footer: Upvote & Comments Toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => communityStore.togglePostUpvote(post.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          post.isUpvotedByMe
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.isUpvotedByMe ? 'fill-amber-400 text-amber-400' : ''}`} />
                        <span>{post.upvotes} Корисно</span>
                      </button>

                      <button
                        onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Коментарі ({post.commentsCount})</span>
                        {expandedCommentsPostId === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <span className="text-[11px] text-neutral-500 uppercase font-semibold">
                      {post.type === 'guide' ? '📖 Гайд' : post.type === 'advice' ? '💡 Порада' : '⚡ Досвід'}
                    </span>
                  </div>

                  {/* Expanded Comments Section */}
                  {expandedCommentsPostId === post.id && (
                    <div className="pt-4 border-t border-neutral-800 space-y-3 animate-in fade-in duration-150">
                      {/* Comments list */}
                      {post.comments && post.comments.length > 0 ? (
                        <div className="space-y-2">
                          {post.comments.map((comm) => (
                            <div key={comm.id} className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-start gap-3">
                              <img src={comm.authorAvatar} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-neutral-700" />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white">{comm.authorName}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                                      {comm.authorRank}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-neutral-500">
                                    {new Date(comm.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-300">{comm.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 text-center py-2">Ще немає коментарів. Будь першим!</p>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newCommentText[post.id] || ''}
                          onChange={(e) => setNewCommentText({ ...newCommentText, [post.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          placeholder="Напиши конструктивний коментар або пораду..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Надіслати</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: ASK THE FORGE (Q&A) ==================== */}
      {activeSubTab === 'ask' && (
        <div className="space-y-6">
          {/* Ask Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-neutral-900 to-neutral-950 border border-cyan-500/30">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                ASK THE FORGE: ЗАПИТАННЯ & ВІДПОВІДІ
              </h3>
              <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                Запитуй про техніку, біль у звʼязках, раціон чи плато. Автор питання нагороджує найкращу відповідь статусом <strong>Best Answer</strong> (+50 Rep XP)!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowCreateQuestionModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Поставити питання (+10 Rep XP)
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`rounded-3xl border bg-neutral-900/80 p-5 sm:p-6 space-y-4 transition-all ${
                  q.isResolved ? 'border-emerald-500/30' : 'border-neutral-800'
                }`}
              >
                {/* Question Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={q.authorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover border border-neutral-700" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{q.authorName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {q.authorRank}
                        </span>
                        {q.isResolved && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Вирішено (Best Answer)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {new Date(q.createdAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    +{q.reputationBounty || 50} Rep Bounty
                  </span>
                </div>

                {/* Title & Details */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                    {q.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {q.details}
                  </p>
                </div>

                {/* Tags & Action row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      #{categoryLabels[q.category]}
                    </span>
                    {q.tags.map((t, idx) => (
                      <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Відповіді ({q.answersCount})</span>
                    {expandedQuestionId === q.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Expanded Answers */}
                {expandedQuestionId === q.id && (
                  <div className="pt-4 border-t border-neutral-800 space-y-4 animate-in fade-in duration-150">
                    {/* Answers list */}
                    <div className="space-y-3">
                      {q.answers.map((ans) => (
                        <div
                          key={ans.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            ans.isBestAnswer
                              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                              : 'bg-neutral-950/70 border-neutral-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <img src={ans.authorAvatar} alt="" className="w-8 h-8 rounded-lg object-cover border border-neutral-700" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{ans.authorName}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                                    {ans.authorRank}
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-500">
                                  {new Date(ans.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            {/* Best Answer Badge or Selector */}
                            {ans.isBestAnswer ? (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-neutral-950 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 fill-neutral-950" />
                                🌟 BEST ANSWER
                              </span>
                            ) : q.authorId === userProfile.id && !q.isResolved ? (
                              <button
                                onClick={() => communityStore.markBestAnswer(q.id, ans.id)}
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-neutral-950 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Award className="w-3.5 h-3.5" />
                                Позначити Best Answer
                              </button>
                            ) : null}
                          </div>

                          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                            {ans.content}
                          </p>

                          {/* Upvote Answer */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80">
                            <button
                              onClick={() => communityStore.toggleAnswerUpvote(q.id, ans.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                ans.isUpvotedByMe
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{ans.upvotes} Допомогло</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Write an answer */}
                    <div className="pt-2 space-y-2">
                      <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                        Твоя експертна відповідь:
                      </h4>
                      <textarea
                        rows={3}
                        value={newAnswerText[q.id] || ''}
                        onChange={(e) => setNewAnswerText({ ...newAnswerText, [q.id]: e.target.value })}
                        placeholder="Опиши конкретні кроки, анатомічні особливості або свій досвід..."
                        className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddAnswer(q.id)}
                        className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Опублікувати відповідь (+15 Rep XP)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: GUILDS ==================== */}
      {activeSubTab === 'guilds' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-950/30 via-neutral-900 to-neutral-950 border border-orange-500/30">
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              FORGE GUILDS: ТЕМАТИЧНІ СПОРТИВНІ ГІЛЬДІЇ
            </h3>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
              Приєднуйся до братства свого напрямку. У кожної гільдії спільний прогрес, щотижневі челенджі та місце в загальному заліку!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className={`rounded-3xl border bg-neutral-900/80 p-6 space-y-5 transition-all relative overflow-hidden ${
                  guild.isJoinedByMe ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-neutral-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-700 flex items-center justify-center text-3xl shadow-inner">
                      {guild.icon}
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white font-heading">
                        {guild.name}
                      </h4>
                      <p className="text-xs text-amber-400 italic">
                        «{guild.motto}»
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-300">
                    Рівень {guild.level}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {guild.description}
                </p>

                {/* Active challenge pill */}
                <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-xs">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">Поточний челендж гільдії:</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    {guild.activeChallenge}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Учасники</span>
                    <span className="text-sm font-extrabold text-white font-heading">{guild.membersCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Загальний XP</span>
                    <span className="text-sm font-extrabold text-amber-400 font-heading">+{guild.totalXp}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950/50 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block uppercase font-bold">Лідер</span>
                    <span className="text-xs font-bold text-neutral-300 truncate block">{guild.leaderName}</span>
                  </div>
                </div>

                {/* Join / Leave button */}
                <div className="pt-2">
                  {guild.isJoinedByMe ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Ти є членом цієї гільдії
                      </span>
                      <button
                        onClick={() => communityStore.leaveGuild(guild.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Покинути
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => communityStore.joinGuild(guild.id)}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer font-heading"
                    >
                      ВСТУПИТИ В ГІЛЬДІЮ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 4: RULES & MODERATION ==================== */}
      {activeSubTab === 'rules' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-heading">
                  КОДЕКС ЧЕСТІ FORGEMUSCLE
                </h3>
                <p className="text-xs text-neutral-400">
                  Правила взаємоповаги, безпеки та чистоти тренувального братства.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>1. Нульова толерантність до токсичності та висміювання</span>
                </h4>
                <p className="text-neutral-400">
                  Кожен атлет колись не міг підтягнутися жодного разу. Допомагай порадою, а не критиканством. Будь-які образи чи агресія ведуть до блокування.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>2. Безпека техніки понад усе</span>
                </h4>
                <p className="text-neutral-400">
                  Не публікуйте гайди з небезпечними кривими рухами («куряче крило» у виході на дві, округлена поперек у становій тязі без застережень).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>3. Доказовість та спортивна правда</span>
                </h4>
                <p className="text-neutral-400">
                  Розвінчуйте міфи, посилайтеся на реальну біомеханіку та дослідження. Заборонено спам сумнівними «чарівними пігулками» та несертифікованими речовинами.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span>4. Система репутації та модерації</span>
                </h4>
                <p className="text-neutral-400">
                  Скарги перевіряються автоматичною системою модерації та радою Наставників. Ви завжди можете поскаржитися на допис або заблокувати користувача кнопкою <Flag className="w-3.5 h-3.5 inline mx-1 text-amber-400" />.
                </p>
              </div>
            </div>

            {/* Blocked Users Count / Unblock */}
            {userProfile.blockedUserIds && userProfile.blockedUserIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-red-500/30 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Список заблокованих тобою авторів:</h4>
                  <p className="text-[11px] text-neutral-400">{userProfile.blockedUserIds.length} користувачів у чорному списку</p>
                </div>
                <button
                  onClick={() => {
                    userProfile.blockedUserIds.forEach(id => communityStore.unblockUser(id));
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 cursor-pointer"
                >
                  Розблокувати всіх
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: CHAT & LIVE ROOMS ==================== */}
      {activeSubTab === 'chat' && (
        <div className="space-y-4">
          <ForgeChat />
        </div>
      )}

      {/* ==================== CREATE POST MODAL ==================== */}
      {showCreatePostModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                НОВИЙ ДОПИС У СПІЛЬНОТУ
              </h3>
              <button
                onClick={() => setShowCreatePostModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Заголовок</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Наприклад: Як я подолав плато у підтягуваннях..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">Категорія</label>
                  <select
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value as CommunityCategory)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    {(Object.keys(categoryLabels) as CommunityCategory[]).map((cat) => (
                      <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">Тип допису</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as PostType)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="experience">Власний досвід</option>
                    <option value="guide">Гайд / Інструкція</option>
                    <option value="advice">Корисна порада</option>
                    <option value="discussion">Обговорення</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Зміст допису</label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Поділися деталями, підходами, розминкою та висновками..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Теги (через кому)</label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="підтягування, хват, техніка"
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-extrabold text-xs sm:text-sm hover:bg-amber-400 transition-all cursor-pointer font-heading"
                >
                  ОПУБЛІКУВАТИ (+15 Rep XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE QUESTION MODAL ==================== */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-cyan-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                ПОСТАВИТИ ПИТАННЯ В ASK THE FORGE
              </h3>
              <button
                onClick={() => setShowCreateQuestionModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Суть запитання (коротко)</label>
                <input
                  type="text"
                  required
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="Наприклад: Як позбутися болю в зап'ястях при стійці на руках?"
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Категорія</label>
                <select
                  value={qCategory}
                  onChange={(e) => setQCategory(e.target.value as CommunityCategory)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                >
                  {(Object.keys(categoryLabels) as CommunityCategory[]).map((cat) => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Подробиці та контекст</label>
                <textarea
                  rows={4}
                  required
                  value={qDetails}
                  onChange={(e) => setQDetails(e.target.value)}
                  placeholder="Опиши свій стаж, розминку, коли саме виникає відчуття та що вже пробував..."
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs sm:text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1">Теги</label>
                <input
                  type="text"
                  value={qTags}
                  onChange={(e) => setQTags(e.target.value)}
                  placeholder="зап'ястя, стійка, біль"
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-cyan-500 text-neutral-950 font-extrabold text-xs sm:text-sm hover:bg-cyan-400 transition-all cursor-pointer font-heading"
                >
                  ОПУБЛІКУВАТИ (+10 Rep XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== REPORT MODAL ==================== */}
      {reportTarget && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-neutral-900 border border-red-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                ПОДАТИ СКАРГУ НА МАТЕРІАЛ
              </h3>
              <button
                onClick={() => setReportTarget(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Оберіть причину скарги:
            </p>

            <div className="space-y-2">
              {[
                { reason: 'spam', title: 'Спам або реклама' },
                { reason: 'toxic', title: 'Образи, токсичність або агресія' },
                { reason: 'dangerous_technique', title: 'Травмонебезпечна техніка виконання' },
                { reason: 'misinformation', title: 'Недостовірна або шкідлива інформація' }
              ].map((item) => (
                <button
                  key={item.reason}
                  onClick={() => {
                    communityStore.reportContent(
                      reportTarget.id,
                      reportTarget.type,
                      item.reason as 'spam' | 'toxic' | 'dangerous_technique' | 'misinformation'
                    );
                    setReportTarget(null);
                  }}
                  className="w-full p-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-xs font-semibold text-neutral-200 transition-all cursor-pointer flex items-center justify-between"
                >
                  <span>{item.title}</span>
                  <Flag className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setReportTarget(null)}
              className="w-full py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white cursor-pointer"
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
