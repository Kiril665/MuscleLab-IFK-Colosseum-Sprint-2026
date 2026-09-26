import React, { useState, useEffect, useRef } from 'react';
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
  Check, 
  Sparkles, 
  ExternalLink, 
  Info, 
  Wallet, 
  Upload, 
  X, 
  Copy, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Layers, 
  ShieldCheck, 
  RefreshCw, 
  ZoomIn, 
  Crop 
} from 'lucide-react';
import { 
  ForgeUser, 
  UserSessionInfo, 
  PrivacyVisibility, 
  MessagePermission, 
  OnlineStatus, 
  ThemePreference, 
  SupportedLanguage, 
  Discipline 
} from '../types';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';
import { i18n, SUPPORTED_LANGUAGES } from '../services/i18n';
import { themeService } from '../services/theme';

interface AccountSettingsProps {
  onClose?: () => void;
  onNavigateHome?: () => void;
  onNavigateToProfile?: () => void;
}

const AVATAR_PRESETS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces', label: 'Spartan Steel' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=faces', label: 'Bar Brawler' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop&crop=faces', label: 'Iron Berserk' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces', label: 'Street Acrobat' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces', label: 'Valkyrie Forge' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=faces', label: 'Cyber Lifter' }
];

export const AccountSettings: React.FC<AccountSettingsProps> = ({ 
  onClose, 
  onNavigateHome, 
  onNavigateToProfile 
}) => {
  const [user, setUser] = useState<ForgeUser | null>(authStore.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'email' | 'security' | 'privacy' | 'wallet' | 'notifications' | 'account'>('profile');
  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);
  const [, setLangTick] = useState(0);

  // Profile Form states
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [discipline, setDiscipline] = useState<Discipline>(user?.discipline || 'hybrid');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Avatar Crop/Preview Modal State
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Appearance & Language State
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18n.getLanguage());
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>(themeService.getTheme());

  // Email Change State
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Privacy states
  const [profileVis, setProfileVis] = useState<PrivacyVisibility>(user?.privacy?.profileVisibility || 'public');
  const [activityVis, setActivityVis] = useState<PrivacyVisibility>(user?.privacy?.activityVisibility || 'public');
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>(user?.privacy?.onlineStatus || 'show');
  const [messagePerm, setMessagePerm] = useState<MessagePermission>(user?.privacy?.messagePermission || 'everyone');
  const [showStats, setShowStats] = useState<boolean>(user?.privacy?.showStats !== false);
  const [showBattleStats, setShowBattleStats] = useState<boolean>(user?.privacy?.showBattleStats !== false);
  const [showAchievements, setShowAchievements] = useState<boolean>(user?.privacy?.showAchievements !== false);

  // Notifications states
  const [notifications, setNotifications] = useState(user?.notifications || {
    messages: true,
    community: true,
    battle: true,
    guild: true,
    achievements: true,
    challenges: true,
    workoutReminders: true,
    systemUpdates: true
  });

  // Solana Wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(user?.walletAddress || null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);

  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);
  const [passChangeError, setPassChangeError] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Subscribe to authStore & i18n & themeService
  useEffect(() => {
    const unsubAuth = authStore.subscribe(() => {
      const u = authStore.getCurrentUser();
      setUser(u);
      if (u) {
        setUsername(u.username);
        setDisplayName(u.displayName);
        setBio(u.bio);
        setAvatar(u.avatar);
        setCurrentEmail(u.email);
        setDiscipline(u.discipline);
        setWalletAddress(u.walletAddress || null);
        if (u.privacy) {
          setProfileVis(u.privacy.profileVisibility);
          setActivityVis(u.privacy.activityVisibility);
          setOnlineStatus(u.privacy.onlineStatus);
          setMessagePerm(u.privacy.messagePermission);
          setShowStats(u.privacy.showStats !== false);
          setShowBattleStats(u.privacy.showBattleStats !== false);
          setShowAchievements(u.privacy.showAchievements !== false);
        }
        if (u.notifications) {
          setNotifications({
            ...u.notifications,
            workoutReminders: u.notifications.workoutReminders !== false,
            systemUpdates: u.notifications.systemUpdates !== false
          });
        }
      }
    });

    const unsubI18n = i18n.subscribe(() => {
      setCurrentLang(i18n.getLanguage());
      setLangTick(t => t + 1);
    });

    const unsubTheme = themeService.subscribe(() => {
      setCurrentTheme(themeService.getTheme());
    });

    return () => {
      unsubAuth();
      unsubI18n();
      unsubTheme();
    };
  }, []);

  // Load sessions when entering security tab
  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    const s = await authStore.fetchActiveSessions();
    setSessions(s);
  };

  // Avatar Image Selection & Validation
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setErrorMessage(i18n.t('settings.avatar.errFormat'));
      sound.playClick();
      return;
    }

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage(i18n.t('settings.avatar.errSize'));
      sound.playClick();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const testImg = new Image();
        testImg.onload = () => {
          setCropImageSrc(reader.result as string);
          setCropZoom(1);
          setErrorMessage(null);
          sound.playClick();
        };
        testImg.onerror = () => {
          setErrorMessage(i18n.t('settings.avatar.errLoad'));
        };
        testImg.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  // Perform square crop to canvas
  const handleConfirmAvatarCrop = () => {
    if (!cropImageSrc) return;
    setIsProcessingCrop(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 320; // High resolution square avatar
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessingCrop(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const minDim = Math.min(img.width, img.height);
      const cropSize = minDim / cropZoom;
      const sx = (img.width - cropSize) / 2;
      const sy = (img.height - cropSize) / 2;

      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      setAvatar(croppedDataUrl);
      setCropImageSrc(null);
      setIsProcessingCrop(false);
      sound.playLevelUp();
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
      setErrorMessage(i18n.t('settings.avatar.errLoad'));
    };
    img.src = cropImageSrc;
  };

  // Remove avatar fallback
  const handleRemoveAvatar = () => {
    sound.playClick();
    setAvatar(AVATAR_PRESETS[0].url);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Language change
  const handleSelectLanguage = (lang: SupportedLanguage) => {
    sound.playClick();
    i18n.setLanguage(lang);
    setCurrentLang(lang);
    if (user) {
      authStore.updateProfile({ language: lang }).catch(() => {});
    }
  };

  // Theme change
  const handleSelectTheme = (thm: ThemePreference) => {
    sound.playClick();
    themeService.setTheme(thm);
    setCurrentTheme(thm);
    if (user) {
      authStore.updateProfile({ theme: thm }).catch(() => {});
    }
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeError(null);
    setPassChangeSuccess(null);

    if (newPass.length < 6) {
      setPassChangeError('Новий пароль повинен містити щонайменше 6 символів.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassChangeError('Новий пароль та підтвердження не співпадають.');
      return;
    }

    setIsChangingPass(true);
    sound.playClick();

    try {
      await authStore.changePassword(currentPass, newPass);
      setIsChangingPass(false);
      setPassChangeSuccess('Пароль успішно оновлено за криптографічним стандартом scrypt.');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      sound.playLevelUp();
      setTimeout(() => setPassChangeSuccess(null), 4000);
    } catch (err: any) {
      setIsChangingPass(false);
      setPassChangeError(err.message || 'Помилка при зміні пароля.');
    }
  };

  // Email Change Handler
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailChangeError(null);
    setEmailChangeSuccess(null);

    if (!newEmail || !emailPassword) {
      setEmailChangeError('Заповніть новий email та підтвердіть поточний пароль.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setEmailChangeError('Введіть коректну адресу електронної пошти.');
      return;
    }

    setIsChangingEmail(true);
    sound.playClick();

    try {
      const updatedUser = await authStore.changeEmail(newEmail.trim(), emailPassword);
      setIsChangingEmail(false);
      setEmailChangeSuccess(`Електронну пошту успішно змінено на ${updatedUser.email}.`);
      setCurrentEmail(updatedUser.email);
      setNewEmail('');
      setEmailPassword('');
      sound.playLevelUp();
      setTimeout(() => setEmailChangeSuccess(null), 4000);
    } catch (err: any) {
      setIsChangingEmail(false);
      setEmailChangeError(err.message || 'Не вдалося змінити електронну пошту.');
    }
  };

  // Solana Wallet Connect / Disconnect Handlers
  const handleConnectSolanaWallet = async () => {
    setIsConnectingWallet(true);
    setWalletError(null);
    setWalletSuccess(null);
    sound.playClick();

    try {
      const solanaProvider = (window as any)?.solana || (window as any)?.phantom?.solana;

      if (!solanaProvider) {
        setWalletError('Solana гаманець (Phantom, Solflare або Brave Wallet) не виявлено в браузері. Встановіть розширення для підключення.');
        setIsConnectingWallet(false);
        return;
      }

      const resp = await solanaProvider.connect();
      const pubKey = resp?.publicKey?.toString() || solanaProvider?.publicKey?.toString();

      if (!pubKey) {
        throw new Error('Не вдалося отримати публічний ключ гаманця.');
      }

      setWalletAddress(pubKey);
      await authStore.updateProfile({ walletAddress: pubKey });
      
      setIsConnectingWallet(false);
      setWalletSuccess(`Гаманець ${pubKey.slice(0, 4)}...${pubKey.slice(-4)} успішно привʼязано до акаунта.`);
      sound.playLevelUp();
      setTimeout(() => setWalletSuccess(null), 4000);
    } catch (err: any) {
      setIsConnectingWallet(false);
      setWalletError(err?.message || 'Користувач скасував підключення або сталася помилка.');
    }
  };

  const handleDisconnectSolanaWallet = async () => {
    sound.playClick();
    setWalletError(null);
    setWalletSuccess(null);

    try {
      const solanaProvider = (window as any)?.solana || (window as any)?.phantom?.solana;
      if (solanaProvider?.disconnect) {
        await solanaProvider.disconnect().catch(() => {});
      }

      setWalletAddress(null);
      await authStore.updateProfile({ walletAddress: null });
      setWalletSuccess('Solana гаманець відвʼязано від вашого профілю.');
      setTimeout(() => setWalletSuccess(null), 3000);
    } catch (err: any) {
      setWalletError('Помилка при відключенні гаманця.');
    }
  };

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setWalletCopied(true);
    sound.playClick();
    setTimeout(() => setWalletCopied(false), 2000);
  };

  // Main Save Handler
  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const cleanUsername = username.startsWith('@') ? username : `@${username}`;
      const rawUser = cleanUsername.replace('@', '');

      if (rawUser.length < 3 || rawUser.length > 25) {
        throw new Error('Username повинен містити від 3 до 25 символів.');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(rawUser)) {
        throw new Error('Username може містити лише латинські літери, цифри та символ підкреслення (_).');
      }

      await authStore.updateProfile({
        username: cleanUsername,
        displayName: displayName.trim() || rawUser,
        bio,
        avatar,
        discipline,
        walletAddress,
        language: currentLang,
        theme: currentTheme,
        privacy: {
          profileVisibility: profileVis,
          activityVisibility: activityVis,
          onlineStatus,
          messagePermission: messagePerm,
          showStats,
          showBattleStats,
          showAchievements
        },
        notifications
      });

      setIsSaving(false);
      setSaveSuccess(true);
      sound.playLevelUp();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'Помилка оновлення налаштувань.');
    }
  };

  // Session & Account management
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
      setErrorMessage(err.message || 'Не вдалося видалити акаунт.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black font-heading text-white">{i18n.t('settings.title')}</h1>
        <p className="text-neutral-400 max-w-md mx-auto text-sm">
          {i18n.t('settings.subtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white flex items-center gap-2">
                {i18n.t('settings.title')}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
                {i18n.t('settings.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Profile Link & Save Button */}
        <div className="flex items-center gap-3">
          {onNavigateToProfile && (
            <button
              onClick={() => {
                sound.playClick();
                onNavigateToProfile();
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{i18n.t('nav.profile')}</span>
            </button>
          )}

          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {i18n.t('settings.savedInCloud')}
            </span>
          )}

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin stroke-[3]" /> : <Check className="w-4 h-4 stroke-[3]" />}
            <span>{isSaving ? i18n.t('settings.saving') : i18n.t('settings.saveChanges')}</span>
          </button>
        </div>
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Vertical Sidebar Navigation + Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs */}
        <div className="space-y-1.5 md:col-span-1">
          {[
            { id: 'profile', label: i18n.t('settings.tabs.profile'), icon: User, desc: i18n.t('settings.tabs.profileDesc') },
            { id: 'appearance', label: i18n.t('settings.tabs.appearance'), icon: Palette, desc: i18n.t('settings.tabs.appearanceDesc') },
            { id: 'email', label: i18n.t('settings.tabs.email'), icon: Mail, desc: i18n.t('settings.tabs.emailDesc') },
            { id: 'security', label: i18n.t('settings.tabs.security'), icon: KeyRound, desc: i18n.t('settings.tabs.securityDesc') },
            { id: 'privacy', label: i18n.t('settings.tabs.privacy'), icon: Shield, desc: i18n.t('settings.tabs.privacyDesc') },
            { id: 'wallet', label: i18n.t('settings.tabs.wallet'), icon: Wallet, desc: i18n.t('settings.tabs.walletDesc') },
            { id: 'notifications', label: i18n.t('settings.tabs.notifications'), icon: Bell, desc: i18n.t('settings.tabs.notificationsDesc') },
            { id: 'account', label: i18n.t('settings.tabs.account'), icon: Layers, desc: i18n.t('settings.tabs.accountDesc') }
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
                className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-3.5 ${
                  isActive
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold shadow-md'
                    : 'bg-neutral-900/40 hover:bg-neutral-900 border border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-[11px] text-neutral-500 font-normal leading-tight mt-0.5">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6">
          
          {/* ==================== 1. PROFILE SECTION ==================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-amber-400" />
                    <span>{i18n.t('settings.tabs.profile')}</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {i18n.t('settings.tabs.profileDesc')}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  {i18n.t('common.level')} {user.level} • {user.xp} {i18n.t('common.xp')}
                </span>
              </div>

              {/* Avatar Selector, Upload & Remove */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                    {i18n.t('settings.avatar.title')}
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{i18n.t('settings.avatar.removeAvatar')}</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {/* Current Active Avatar Preview */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-neutral-900">
                      <img 
                        src={avatar || AVATAR_PRESETS[0].url} 
                        alt="Current Avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    {/* Presets Row */}
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-400 block mb-1.5">
                        {i18n.t('settings.avatar.chooseStyle')}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_PRESETS.map(preset => (
                          <button
                            type="button"
                            key={preset.id}
                            onClick={() => {
                              sound.playClick();
                              setAvatar(preset.url);
                            }}
                            className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              avatar === preset.url
                                ? 'border-amber-400 ring-2 ring-amber-500/50 scale-105'
                                : 'border-neutral-800 opacity-60 hover:opacity-100'
                            }`}
                            title={preset.label}
                          >
                            <img src={preset.url} alt={preset.label} className="w-10 h-10 object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload File with File Picker */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageFileSelect}
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{i18n.t('settings.avatar.uploadBtn')}</span>
                      </button>

                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <input
                          type="url"
                          placeholder={i18n.t('settings.avatar.urlPlaceholder')}
                          value={customAvatarUrl}
                          onChange={e => setCustomAvatarUrl(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        {customAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setAvatar(customAvatarUrl);
                              setCustomAvatarUrl('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 text-neutral-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-400"
                          >
                            OK
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Username & Display Name Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      {i18n.t('settings.profileForm.username')}
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {username.replace('@', '').length}/25
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-amber-400 font-mono">@</span>
                    <input
                      type="text"
                      maxLength={25}
                      value={username.replace('@', '')}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {i18n.t('settings.profileForm.usernameHelp')}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      {i18n.t('settings.profileForm.displayName')}
                    </label>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {displayName.length}/35
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={35}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Athlete Name"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    {i18n.t('settings.profileForm.displayNameHelp')}
                  </p>
                </div>
              </div>

              {/* Training Discipline Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {i18n.t('settings.profileForm.discipline')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'bodybuilding' as Discipline, label: 'Бодибілдинг', desc: 'Залізо, обʼєми та симетрія', icon: '🏋️' },
                    { id: 'calisthenics' as Discipline, label: 'Калістеніка', desc: 'Турнік, бруси, контроль тіла', icon: '🤸' },
                    { id: 'hybrid' as Discipline, label: 'Гібридний Атлетизм', desc: 'Синтез штанги та воркауту', icon: '⚡' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setDiscipline(item.id);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        discipline === item.id
                          ? 'border-amber-500 bg-amber-500/15 text-white shadow-md ring-1 ring-amber-500/40'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-base mb-1">{item.icon}</div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    {i18n.t('settings.profileForm.bio')}
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {bio.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder={i18n.t('settings.profileForm.bioPlaceholder')}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-sm text-white focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* ==================== 2. APPEARANCE & LANGUAGE SECTION ==================== */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.appearance.title')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.appearance.subtitle')}
                </p>
              </div>

              {/* Language Selector */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span>{i18n.t('settings.appearance.langTitle')}</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SUPPORTED_LANGUAGES.map(lang => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/40 shadow-md'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{lang.nativeName}</div>
                          <div className="text-[10px] text-neutral-400">{lang.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {i18n.t('settings.appearance.langAutoNotice')}
                </p>
              </div>

              {/* Theme Selector */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>{i18n.t('settings.appearance.themeTitle')}</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dark' as ThemePreference, label: i18n.t('settings.appearance.themeDark'), desc: i18n.t('settings.appearance.themeDarkDesc'), icon: '🌑' },
                    { id: 'light' as ThemePreference, label: i18n.t('settings.appearance.themeLight'), desc: i18n.t('settings.appearance.themeLightDesc'), icon: '☀️' },
                    { id: 'system' as ThemePreference, label: i18n.t('settings.appearance.themeSystem'), desc: i18n.t('settings.appearance.themeSystemDesc'), icon: '💻' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTheme(item.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                        currentTheme === item.id
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-2 ring-amber-500/40 shadow-md'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-lg">{item.icon}</div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-neutral-400 leading-tight">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. EMAIL SECTION ==================== */}
          {activeTab === 'email' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.tabs.email')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.tabs.emailDesc')}
                </p>
              </div>

              {/* Current Email Display */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-300">Поточна привʼязана пошта</div>
                  <div className="text-sm font-mono text-amber-400 font-bold mt-0.5">{currentEmail}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {i18n.t('common.verified')}
                </span>
              </div>

              {/* Email Change Form */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Зміна адреси електронної пошти</span>
                </h3>

                {emailChangeSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailChangeSuccess}</span>
                  </div>
                )}

                {emailChangeError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{emailChangeError}</span>
                  </div>
                )}

                <form onSubmit={handleChangeEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Нова адреса електронної пошти
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="athlete@domain.com"
                      className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      Поточний пароль для підтвердження
                    </label>
                    <input
                      type="password"
                      required
                      value={emailPassword}
                      onChange={e => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingEmail}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isChangingEmail ? 'Оновлення...' : 'Оновити Email'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================== 4. SECURITY SECTION ==================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.security.title')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.security.subtitle')}
                </p>
              </div>

              {/* Change Password Form */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <KeyRound className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {i18n.t('settings.security.changePass')}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPasswords ? i18n.t('settings.security.hidePass') : i18n.t('settings.security.showPass')}</span>
                  </button>
                </div>

                {passChangeSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{passChangeSuccess}</span>
                  </div>
                )}

                {passChangeError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{passChangeError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">
                      {i18n.t('settings.security.currentPass')}
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      required
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1">
                        {i18n.t('settings.security.newPass')}
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-1">
                        {i18n.t('settings.security.confirmPass')}
                      </label>
                      <input
                        type={showPasswords ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isChangingPass ? i18n.t('settings.saving') : i18n.t('settings.security.updatePassBtn')}</span>
                  </button>
                </form>
              </div>

              {/* Active Sessions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {i18n.t('settings.security.sessionsTitle')}
                  </h3>
                  <button
                    onClick={handleLogoutAll}
                    className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                  >
                    {i18n.t('settings.security.logoutAll')}
                  </button>
                </div>

                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-400">
                      {i18n.t('common.loading')}
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
                              <span>{s.device} ({s.browser})</span>
                              {s.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-950 border border-emerald-500/40 text-emerald-400 uppercase tracking-wide">
                                  {i18n.t('settings.security.currentDevice')}
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
                            className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {i18n.t('settings.security.revoke')}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. PRIVACY SECTION ==================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.privacy.title')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.privacy.subtitle')}
                </p>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white">
                  {i18n.t('settings.privacy.profileVis')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'public' as PrivacyVisibility, label: 'Public', desc: i18n.t('settings.privacy.visPublic') },
                    { id: 'friends' as PrivacyVisibility, label: 'Friends', desc: i18n.t('settings.privacy.visFriends') },
                    { id: 'private' as PrivacyVisibility, label: 'Private', desc: i18n.t('settings.privacy.visPrivate') }
                  ].map(val => (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setProfileVis(val.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        profileVis === val.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{val.label}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{val.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistics & Achievements Visibility Toggles */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-white block">
                  Відображення компонентів статистики
                </label>

                {[
                  {
                    key: 'showStats',
                    state: showStats,
                    setter: setShowStats,
                    label: i18n.t('settings.privacy.showStats'),
                    desc: 'Кількість виконаних повторень, чистий обсяг та рівень коваля'
                  },
                  {
                    key: 'showBattleStats',
                    state: showBattleStats,
                    setter: setShowBattleStats,
                    label: i18n.t('settings.privacy.showBattleStats'),
                    desc: 'Історія дуелей 1v1 та вінрейт у лізі'
                  },
                  {
                    key: 'showAchievements',
                    state: showAchievements,
                    setter: setShowAchievements,
                    label: i18n.t('settings.privacy.showAchievements'),
                    desc: 'Колекція трофеїв та виконаних випробувань'
                  }
                ].map(item => (
                  <div
                    key={item.key}
                    onClick={() => {
                      sound.playClick();
                      item.setter(!item.state);
                    }}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</div>
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ml-4 ${item.state ? 'bg-amber-500' : 'bg-neutral-800'}`}>
                      <div className={`w-4 h-4 rounded-full bg-neutral-950 transition-transform ${item.state ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Online Status */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-white">{i18n.t('settings.privacy.onlineStatus')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['show', 'hide'] as OnlineStatus[]).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setOnlineStatus(val);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        onlineStatus === val
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                      }`}
                    >
                      {val === 'show' ? 'Show (Показувати "В мережі")' : 'Hide (Приховувати)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. WALLET SECTION ==================== */}
          {activeTab === 'wallet' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-amber-400" />
                    <span>{i18n.t('settings.wallet.title')}</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {i18n.t('settings.wallet.subtitle')}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono">
                  Solana Devnet
                </span>
              </div>

              {walletSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{walletSuccess}</span>
                </div>
              )}

              {walletError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{walletError}</span>
                </div>
              )}

              {/* Wallet Status Card */}
              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${walletAddress ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {walletAddress ? i18n.t('settings.wallet.connected') : i18n.t('settings.wallet.notConnected')}
                    </span>
                  </div>

                  {walletAddress && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Ed25519 Verified
                    </span>
                  )}
                </div>

                {walletAddress ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-neutral-400">{i18n.t('settings.wallet.address')}</div>
                        <div className="text-xs font-mono text-amber-300 break-all font-bold">
                          {walletAddress}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyWallet}
                          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 text-xs flex items-center gap-1 cursor-pointer"
                          title="Скопіювати адресу"
                        >
                          {walletCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{walletCopied ? i18n.t('common.copied') : i18n.t('common.copy')}</span>
                        </button>

                        <a
                          href={`https://explorer.solana.com/address/${walletAddress}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border border-neutral-700 text-xs flex items-center gap-1"
                          title="Переглянути в Solana Explorer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Explorer</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[11px] text-neutral-400">
                        {i18n.t('settings.wallet.securityNote')}
                      </p>
                      <button
                        type="button"
                        onClick={handleDisconnectSolanaWallet}
                        className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        {i18n.t('settings.wallet.disconnectBtn')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {i18n.t('settings.wallet.subtitle')}
                    </p>

                    <button
                      type="button"
                      onClick={handleConnectSolanaWallet}
                      disabled={isConnectingWallet}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{isConnectingWallet ? i18n.t('common.loading') : i18n.t('settings.wallet.connectBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 7. NOTIFICATIONS SECTION ==================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.notifications.title')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.notifications.subtitle')}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'workoutReminders', label: i18n.t('settings.notifications.workoutReminders'), desc: 'Мотиваційні сигнали та підтримка стріку' },
                  { key: 'battle', label: i18n.t('settings.notifications.battleAlerts'), desc: 'Виклики на дуель від суперників та результати' },
                  { key: 'achievements', label: i18n.t('settings.notifications.achievements'), desc: 'Розблокування нових трофеїв, XP та рангів' },
                  { key: 'challenges', label: 'Щотижневі випробування та квести', desc: 'Оновлення щоденних завдань' },
                  { key: 'community', label: i18n.t('settings.notifications.community'), desc: 'Відповіді на пости, апвоути та експертні Best Answers' },
                  { key: 'guild', label: i18n.t('settings.notifications.guild'), desc: 'Події клану та спільний прогрес братства' },
                  { key: 'systemUpdates', label: i18n.t('settings.notifications.systemUpdates'), desc: 'Нові вправи, алгоритми трекінгу та покращення' }
                ].map(item => {
                  const isChecked = (notifications as any)[item.key] !== false;
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
                        <div className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ml-4 ${isChecked ? 'bg-amber-500' : 'bg-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-neutral-950 transition-transform ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 8. ACCOUNT MANAGEMENT SECTION ==================== */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-neutral-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>{i18n.t('settings.account.title')}</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {i18n.t('settings.account.subtitle')}
                </p>
              </div>

              {/* Account IDs & Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-xs font-bold text-neutral-300">{i18n.t('settings.account.accountId')}</div>
                  <p className="text-xs font-mono text-amber-400 font-bold">{user.id}</p>
                  <p className="text-[10px] text-neutral-500">Незмінний ідентифікатор прогресу та покупок.</p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-xs font-bold text-neutral-300">{i18n.t('settings.account.createdAt')}</div>
                  <p className="text-xs text-neutral-200">{new Date(user.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-neutral-500">Час створення ковальського шляху.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{i18n.t('settings.account.role')}</div>
                  <p className="text-xs text-neutral-400">Привілеї та права доступу</p>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-black bg-amber-500/20 border border-amber-500/50 text-amber-300 uppercase tracking-wide">
                  {user.role}
                </span>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogoutCurrent}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-600 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{i18n.t('settings.account.logoutBtn')}</span>
                </button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="pt-6 border-t border-red-950/60 space-y-3">
                <div className="flex items-start gap-2.5 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-red-300">
                      {i18n.t('settings.account.dangerZone')}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {i18n.t('settings.account.deleteDesc')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{i18n.t('settings.account.deleteBtn')}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Interactive Avatar Crop & Zoom Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border-2 border-amber-500/60 p-6 space-y-5 text-neutral-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5 text-amber-400">
                <Crop className="w-5 h-5" />
                <h3 className="text-base font-bold font-heading text-white">
                  {i18n.t('settings.avatar.cropTitle')}
                </h3>
              </div>
              <button
                onClick={() => setCropImageSrc(null)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circular / Square Viewport Preview */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-neutral-950 flex items-center justify-center">
                <img
                  src={cropImageSrc}
                  alt="Crop Preview"
                  style={{
                    transform: `scale(${cropZoom})`,
                    transition: 'transform 0.05s ease-out'
                  }}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
                <div className="absolute inset-0 border border-amber-500/40 rounded-2xl pointer-events-none" />
              </div>

              {/* Zoom Slider */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>{i18n.t('settings.avatar.zoom')}</span>
                  </span>
                  <span className="font-mono text-amber-400">{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropZoom}
                  onChange={e => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setCropImageSrc(null)}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {i18n.t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isProcessingCrop}
                onClick={handleConfirmAvatarCrop}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isProcessingCrop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{i18n.t('settings.avatar.applyCrop')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Warning Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border-2 border-red-500/50 p-6 space-y-4 text-neutral-100 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-500/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading text-red-300">
                {i18n.t('settings.account.deleteModalTitle')}
              </h3>
            </div>

            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed">
              <p className="font-bold text-red-200">
                {i18n.t('settings.account.deleteModalWarning')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-400 pl-1">
                <li>Всі збережені сесії та історію повторень</li>
                <li>Накопичений прогрес ({user.xp} XP, рівень {user.level})</li>
                <li>Історію квестів, досягнень та рейтинг</li>
                <li>Активні сесії на всіх пристроях</li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-neutral-300">
                {i18n.t('settings.account.deleteModalPrompt')}: <span className="text-red-400 font-mono font-bold">{user.username}</span>
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
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {i18n.t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== user.username || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? i18n.t('common.loading') : i18n.t('common.confirm')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
