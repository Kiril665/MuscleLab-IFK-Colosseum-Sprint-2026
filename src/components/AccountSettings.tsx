import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  KeyRound, 
  LogOut, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Laptop, 
  Smartphone, 
  Globe, 
  Clock, 
  Check, 
  Sparkles,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { ForgeUser, UserSessionInfo, PrivacyVisibility, MessagePermission, OnlineStatus, ThemePreference, Discipline } from '../types';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';

interface AccountSettingsProps {
  onClose?: () => void;
  onNavigateHome?: () => void;
}

const AVATAR_PRESETS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces', label: 'Spartan Steel' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces', label: 'Bar Brawler' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces', label: 'Iron Berserk' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces', label: 'Street Acrobat' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces', label: 'Valkyrie Forge' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces', label: 'Cyber Lifter' }
];

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose, onNavigateHome }) => {
  const [user, setUser] = useState<ForgeUser | null>(authStore.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'notifications' | 'appearance' | 'privacy' | 'security'>('account');
  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [discipline, setDiscipline] = useState<Discipline>(user?.discipline || 'hybrid');
  
  // Privacy
  const [profileVis, setProfileVis] = useState<PrivacyVisibility>(user?.privacy?.profileVisibility || 'public');
  const [activityVis, setActivityVis] = useState<PrivacyVisibility>(user?.privacy?.activityVisibility || 'public');
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>(user?.privacy?.onlineStatus || 'show');
  const [messagePerm, setMessagePerm] = useState<MessagePermission>(user?.privacy?.messagePermission || 'everyone');

  // Notifications
  const [notifications, setNotifications] = useState(user?.notifications || {
    messages: true,
    community: true,
    battle: true,
    guild: true,
    achievements: true,
    challenges: true
  });

  // Appearance
  const [theme, setTheme] = useState<ThemePreference>(user?.theme || 'dark');

  // Status & Feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      const u = authStore.getCurrentUser();
      setUser(u);
      if (u) {
        setUsername(u.username);
        setDisplayName(u.displayName);
        setBio(u.bio);
        setAvatar(u.avatar);
        setDiscipline(u.discipline);
        if (u.privacy) {
          setProfileVis(u.privacy.profileVisibility);
          setActivityVis(u.privacy.activityVisibility);
          setOnlineStatus(u.privacy.onlineStatus);
          setMessagePerm(u.privacy.messagePermission);
        }
        if (u.notifications) setNotifications(u.notifications);
        if (u.theme) setTheme(u.theme);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    const s = await authStore.fetchActiveSessions();
    setSessions(s);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      await authStore.updateProfile({
        username: username.startsWith('@') ? username : `@${username}`,
        displayName,
        bio,
        avatar,
        discipline,
        privacy: {
          profileVisibility: profileVis,
          activityVisibility: activityVis,
          onlineStatus,
          messagePermission: messagePerm
        },
        notifications,
        theme
      });

      setIsSaving(false);
      setSaveSuccess(true);
      sound.playLevelUp();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || "Помилка оновлення налаштувань.");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    sound.playClick();
    await authStore.revokeSession(sessionId);
    await loadSessions();
  };

  const handleLogoutCurrent = async () => {
    sound.playClick();
    await authStore.logout();
    if (onClose) onClose();
    if (onNavigateHome) onNavigateHome();
  };

  const handleLogoutAll = async () => {
    sound.playClick();
    await authStore.logoutAllDevices();
    if (onClose) onClose();
    if (onNavigateHome) onNavigateHome();
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    sound.playClick();

    try {
      await authStore.deleteAccount(deleteConfirmText);
      setIsDeleting(false);
      setShowDeleteModal(false);
      if (onClose) onClose();
      if (onNavigateHome) onNavigateHome();
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMessage(err.message || "Не вдалося видалити акаунт.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-white"># Settings</h1>
        <p className="text-neutral-400">Увійдіть в акаунт ForgeMuscle для доступу до персональних налаштувань.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
              # Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Керуй своїм акаунтом, приватністю, сесіями та зовнішнім виглядом Кузні
          </p>
        </div>

        {/* Global Save Button */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Збережено!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'Збереження...' : 'Зберегти зміни'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Vertical Sidebar Navigation + Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs (#70) */}
        <div className="space-y-1.5 md:col-span-1">
          {[
            { id: 'account', label: 'Account (Акаунт)', icon: KeyRound, desc: 'ID, пошта, Google' },
            { id: 'profile', label: 'Profile (Профіль)', icon: User, desc: 'Аватар, біографія, дисципліна' },
            { id: 'notifications', label: 'Notifications (Сповіщення)', icon: Bell, desc: 'Повідомлення, гільдія' },
            { id: 'appearance', label: 'Appearance (Вигляд)', icon: Palette, desc: 'Тема, кольори' },
            { id: 'privacy', label: 'Privacy (Приватність)', icon: Shield, desc: 'Видимість активності' },
            { id: 'security', label: 'Security (Безпека)', icon: LogOut, desc: 'Активні сесії, видалення' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                  setErrorMessage(null);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold shadow-md'
                    : 'bg-neutral-900/50 hover:bg-neutral-900 border border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <div>
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-[10px] text-neutral-500 font-normal">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
          
          {/* SECTION 1: ACCOUNT (#70) */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Налаштування Акаунта</h2>
                <p className="text-xs text-neutral-400">Керування ідентифікатором, адресою пошти та Google-авторизацією</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Username (#65)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-amber-400">@</span>
                    <input
                      type="text"
                      value={username.replace('@', '')}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">Зміна username лімітована раз на 14 днів для захисту репутації.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-neutral-950/50 border border-neutral-850 rounded-xl px-3 py-2.5 text-sm text-neutral-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Привʼязана адреса для авторизації та відновлення доступу.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Google Account (#62)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                      Підключено
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
                </div>
                <div className="text-xs text-neutral-400">
                  OpenID Connect 2.0
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                <div className="text-xs font-bold text-neutral-300">Internal Account ID (#66)</div>
                <p className="text-xs font-mono text-amber-400">{user.id}</p>
                <p className="text-[10px] text-neutral-500">
                  Внутрішній незмінний ідентифікатор системи, що повʼязує прогрес, покупки та бойову історію.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Роль на платформі (#75)</div>
                  <p className="text-xs text-neutral-400">Привілеї в системі ForgeMuscle</p>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-amber-500/20 border border-amber-500/50 text-amber-300 uppercase tracking-wide">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* SECTION 2: PROFILE (#70, #81) */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Дані Профілю</h2>
                <p className="text-xs text-neutral-400">Твій вигляд в RPG-картці атлета, спільноті та чатах</p>
              </div>

              {/* Avatar Selector & Google Avatar (#81) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">Аватар атлета</label>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces');
                    }}
                    className="text-xs text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Використати Google фото (#81)</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-lg shrink-0">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map(preset => (
                      <img
                        key={preset.id}
                        src={preset.url}
                        alt={preset.label}
                        onClick={() => {
                          sound.playClick();
                          setAvatar(preset.url);
                        }}
                        className={`w-10 h-10 rounded-xl object-cover border-2 transition-all cursor-pointer hover:scale-105 ${
                          avatar === preset.url ? 'border-amber-400 ring-2 ring-amber-500/40' : 'border-neutral-800 opacity-60 hover:opacity-100'
                        }`}
                        title={preset.label}
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Display Name (Імʼя)</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Training Direction</label>
                  <select
                    value={discipline}
                    onChange={e => setDiscipline(e.target.value as Discipline)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none capitalize"
                  >
                    <option value="bodybuilding">Бодибілдинг</option>
                    <option value="calisthenics">Калістеніка</option>
                    <option value="hybrid">Гібридний атлетизм</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Біографія атлета (Bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Розкажи про свої спортивні цілі, улюблені вправи та шлях..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: NOTIFICATIONS (#70) */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Сповіщення (Notifications)</h2>
                <p className="text-xs text-neutral-400">Налаштуй, які події активують сигнали та повідомлення</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'messages', label: 'Особисті повідомлення (Messages)', desc: 'Прямі повідомлення від друзів та соратників' },
                  { key: 'community', label: 'Спільнота (Community)', desc: 'Відповіді на пости, коментарі та апвоути' },
                  { key: 'battle', label: 'Battle Mode & Дуелі', desc: 'Виклики на дуель 1v1 та результати поєдинків' },
                  { key: 'guild', label: 'Гільдія (Guild)', desc: 'Кланові сповіщення та спільні рейдові челенджі' },
                  { key: 'achievements', label: 'Досягнення (Achievements)', desc: 'Розблокування нових трофеїв та рівнів коваля' },
                  { key: 'challenges', label: 'Щотижневі челенджі', desc: 'Нагадування про завершення терміну випробувань' }
                ].map(item => {
                  const isChecked = (notifications as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => {
                        sound.playClick();
                        setNotifications({ ...notifications, [item.key]: !isChecked });
                      }}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[11px] text-neutral-400">{item.desc}</div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isChecked ? 'bg-amber-500' : 'bg-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-neutral-950 transition-transform ${isChecked ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 4: APPEARANCE (#70) */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Зовнішній Вигляд (Appearance)</h2>
                <p className="text-xs text-neutral-400">Обери тему інтерфейсу Кузні</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'dark' as ThemePreference, label: 'Dark (Темна)', desc: 'Вугільний монохром з полумʼям коваля' },
                  { id: 'light' as ThemePreference, label: 'Light (Світла)', desc: 'Денний високий контраст' },
                  { id: 'system' as ThemePreference, label: 'System (Системна)', desc: 'Автоматично за налаштуваннями ОС' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setTheme(item.id);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-center space-y-1 ${
                      theme === item.id
                        ? 'border-amber-500 bg-amber-500/15 text-white'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] text-neutral-400 leading-tight">{item.desc}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Налаштування теми зберігаються в локальному кеші для миттєвого рендерингу при відкритті.</span>
              </div>
            </div>
          )}

          {/* SECTION 5: PRIVACY (#70, #71) */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Приватність (Privacy)</h2>
                <p className="text-xs text-neutral-400">Контроль видимості твоїх даних, тренувань та онлайн-статусу</p>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Profile (Видимість профілю)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['public', 'friends', 'private'] as PrivacyVisibility[]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setProfileVis(val);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        profileVis === val
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {val === 'public' ? 'Public (Всі)' : val === 'friends' ? 'Friends (Друзі)' : 'Private (Тільки я)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Activity (Видимість активності)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['public', 'friends', 'private'] as PrivacyVisibility[]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setActivityVis(val);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        activityVis === val
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {val === 'public' ? 'Public (Всі)' : val === 'friends' ? 'Friends (Друзі)' : 'Private (Тільки я)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Online Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Online Status (Статус у мережі)</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['show', 'hide'] as OnlineStatus[]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setOnlineStatus(val);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        onlineStatus === val
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {val === 'show' ? 'Show (Показувати online)' : 'Hide (Приховувати online)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Permission */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">Messages (Хто може писати)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['everyone', 'friends', 'nobody'] as MessagePermission[]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setMessagePerm(val);
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        messagePerm === val
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {val === 'everyone' ? 'Everyone (Всі)' : val === 'friends' ? 'Friends (Друзі)' : 'Nobody (Ніхто)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SECURITY & SESSIONS (#70, #72, #73) */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white">Безпека та Сесії (Security)</h2>
                <p className="text-xs text-neutral-400">Керуй активними входами та видаленням облікового запису</p>
              </div>

              {/* Active Sessions (#73) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Active Sessions (Активні сесії)
                  </h3>
                  <button
                    onClick={handleLogoutAll}
                    className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                  >
                    Log out all devices (Вийти з усіх пристроїв)
                  </button>
                </div>

                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-400">
                      Завантаження списку сесій...
                    </div>
                  ) : (
                    sessions.map(s => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                            {s.device.includes('Smart') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{s.device}</span>
                              {s.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase tracking-wide">
                                  Active now
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                              <span>IP: {s.ip}</span>
                              <span>•</span>
                              <span>{new Date(s.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-850 hover:border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Відкликати
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logout current device */}
              <div className="pt-2">
                <button
                  onClick={handleLogoutCurrent}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-600 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out (Вийти з цього пристрою)</span>
                </button>
              </div>

              {/* Account Deletion (#72) */}
              <div className="pt-6 border-t border-red-950/50 space-y-3">
                <div className="flex items-start gap-2.5 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-300">Небезпечна зона (Danger Zone)</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Видалення облікового запису безповоротно очищує всю історію тренувань, рівні XP, досягнення та покупки в хмарі.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account (Видалити акаунт)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Deletion Warning Modal (#72) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border-2 border-red-500/50 p-6 space-y-4 text-neutral-100 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-500/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading text-red-300">Видалення акаунта</h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed">
              <p className="font-bold text-red-200">
                Ця дія є остаточною та не може бути скасована!
              </p>
              <p>
                З хмарної бази даних буде повністю та назавжди видалено:
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                <li>Всі збережені сесії та історія підрахунку репів</li>
                <li>Накопичений XP ({user.xp} XP) та поточний рівень {user.level}</li>
                <li>Історія квестів, досягнень та Forge Score</li>
                <li>Членство у гільдії, придбані програми маркетплейсу</li>
                <li>Активні сесії на всіх мобільних та ПК пристроях</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Для підтвердження введіть ваш точний username: <span className="text-red-400 font-mono font-bold">{user.username}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={user.username}
                className="w-full bg-neutral-950 border border-red-500/40 focus:border-red-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== user.username || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Видалення...' : 'Підтвердити видалення'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
