import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Camera, 
  VideoOff, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Volume2, 
  Smartphone, 
  Shield, 
  Trash2, 
  LogOut, 
  Check, 
  Sparkles, 
  Globe, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  Key, 
  Radio, 
  SmartphoneNfc,
  ExternalLink,
  Lock,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import { authStore } from '../../services/authStore';
import { mediaSettingsStore, MediaSettingsState } from '../../services/mediaSettingsStore';
import { soundEngine } from '../../services/soundEngine';
import { useI18n } from '../../services/i18n';
import { SolanaWalletCard } from '../common/SolanaWalletCard';
import { SUPPORTED_LOCALES, SupportedLocale } from '../../config/locales';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartOnboarding?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRestartOnboarding
}) => {
  const { t, lang, setLanguage } = useI18n();
  const user = authStore.getUser();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'mic' | 'camera' | 'account' | 'general'>('mic');

  // Media state from centralized store
  const [mediaSettings, setMediaSettings] = useState<MediaSettingsState>(mediaSettingsStore.getSettings());
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const [isTestingCam, setIsTestingCam] = useState<boolean>(false);
  const testCamVideoRef = useRef<HTMLVideoElement | null>(null);
  const testCamStreamRef = useRef<MediaStream | null>(null);

  // Account state
  const [nick, setNick] = useState(user.nick);
  const [avatar, setAvatar] = useState(user.avatar);
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [activeSessions, setActiveSessions] = useState<{ id: string; device_info: string; ip: string; last_active: number }[]>([]);

  // General state
  const [theme, setTheme] = useState(user.settings.theme);
  const [sound, setSound] = useState(user.settings.soundEnabled);
  const [haptic, setHaptic] = useState(user.settings.hapticEnabled);
  const [privacy, setPrivacy] = useState(user.settings.privacy);

  // Modals inside Settings
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [avatarUploading,setAvatarUploading]=useState(false);
  const uploadAvatar=async(file?:File)=>{if(!file||!file.type.startsWith('image/')||file.size>5*1024*1024)return;setAvatarUploading(true);try{const dataUrl=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;const side=Math.min(img.naturalWidth,img.naturalHeight);const ctx=c.getContext('2d');if(!ctx)return reject(new Error('canvas'));ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,256,256);resolve(c.toDataURL('image/webp',.82));};img.onerror=reject;img.src=String(r.result)};r.onerror=reject;r.readAsDataURL(file)});const res=await fetch('/api/profile/avatar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl})});const d=await res.json();if(!res.ok)throw new Error(d.error||'Upload failed');const url=`${d.avatar}?v=${Date.now()}`;setAvatar(url);await authStore.updateProfile(nick,url);}catch(e){setPasswordFeedback({type:'error',msg:e instanceof Error?e.message:'Не вдалося завантажити фото'});}finally{setAvatarUploading(false);}};

  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [saveToast, setSaveToast] = useState(false);

  // PWA Install Prompt
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  const avatarsList = ['⚡', '🦁', '🐺', '🦾', '🔥', '🦅', '👑', '🌱', '🤖', '🎯', '⚔️', '🏋️'];

  useEffect(() => {
    const unsubMedia = mediaSettingsStore.subscribe(() => {
      setMediaSettings(mediaSettingsStore.getSettings());
      setAudioLevel(mediaSettingsStore.audioLevel);
      setIsTestingMic(mediaSettingsStore.isTestingMic);
    });

    // Capture PWA install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      unsubMedia();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      stopCamTest();
      mediaSettingsStore.stopMicTest();
    };
  }, []);

  useEffect(() => {
    if (isOpen && authStore.getIsAuthenticated()) {
      fetch('/api/auth/sessions')
        .then((res) => res.json())
        .then((data) => {
          if (data.sessions) setActiveSessions(data.sessions);
        })
        .catch(() => {});
      mediaSettingsStore.checkPermissions();
      mediaSettingsStore.refreshDevices();
    }
  }, [isOpen]);

  // Clean up cam test if switching tab or closing
  const stopCamTest = () => {
    if (testCamStreamRef.current) {
      testCamStreamRef.current.getTracks().forEach((t) => t.stop());
      testCamStreamRef.current = null;
    }
    setIsTestingCam(false);
  };

  const startCamTest = async () => {
    stopCamTest();
    try {
      const constraints: MediaStreamConstraints = {
        video: mediaSettings.selectedCameraId
          ? { deviceId: { exact: mediaSettings.selectedCameraId } }
          : { facingMode: mediaSettings.facingMode }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testCamStreamRef.current = stream;
      if (testCamVideoRef.current) {
        testCamVideoRef.current.srcObject = stream;
        testCamVideoRef.current.play().catch(() => {});
      }
      setIsTestingCam(true);
    } catch {
      setIsTestingCam(false);
    }
  };

  const handleToggleMicTest = () => {
    if (isTestingMic) {
      mediaSettingsStore.stopMicTest();
    } else {
      mediaSettingsStore.startMicTest();
    }
  };

  const handleToggleCamTest = () => {
    if (isTestingCam) {
      stopCamTest();
    } else {
      startCamTest();
    }
  };

  const handleSaveGeneral = () => {
    authStore.updateProfile(nick, avatar);
    authStore.updateSettings({
      language: lang,
      theme,
      soundEnabled: sound,
      hapticEnabled: haptic,
      privacy
    });
    soundEngine.enabled = sound;
    soundEngine.hapticsEnabled = haptic;

    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 700);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: curPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordFeedback({ type: 'error', msg: data.error || t.common.error });
      } else {
        setPasswordFeedback({ type: 'success', msg: t.common.success });
        setCurPassword('');
        setNewPassword('');
      }
    } catch {
      setPasswordFeedback({ type: 'error', msg: t.common.error });
    }
  };

  const handleExportData = () => {
    window.open('/api/user/export', '_blank');
  };

  const handleDeleteWorkoutData = async () => {
    try {
      await fetch('/api/user/delete-data', { method: 'POST' });
      setShowDeleteDataModal(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 1500);
    } catch {}
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await authStore.logout();
    onClose();
  };

  const handleLogoutAll = async () => {
    await fetch('/api/auth/logout-all', { method: 'POST' });
    setShowLogoutModal(false);
    authStore.logout();
    onClose();
  };

  const handleDeleteAccountConfirmed = async () => {
    const requiredWord = lang === 'uk' ? 'ВИДАЛИТИ' : lang === 'pl' ? 'USUŃ' : lang === 'de' ? 'LÖSCHEN' : lang === 'fr' ? 'SUPPRIMER' : lang === 'es' ? 'ELIMINAR' : 'DELETE';
    if (deleteConfirmationInput.trim().toUpperCase() === requiredWord || deleteConfirmationInput.trim().toUpperCase() === 'ВИДАЛИТИ' || deleteConfirmationInput.trim().toUpperCase() === 'DELETE') {
      setShowDeleteModal(false);
      await authStore.deleteAccount();
      onClose();
    }
  };

  const handlePwaInstall = async () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      const { outcome } = await pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
        setPwaPrompt(null);
      }
    }
  };

  const handleTriggerRestartOnboarding = async () => {
    try {
      await fetch('/api/onboarding/reset', { method: 'POST' });
    } catch {}
    onClose();
    if (onRestartOnboarding) {
      onRestartOnboarding();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t.settings.title} maxWidth="lg">
        <div className="flex flex-col gap-5 text-sm">
          {/* Section Navigation Tabs */}
          <div className="grid grid-cols-4 p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] gap-1">
            <button
              onClick={() => { setActiveTab('mic'); stopCamTest(); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'mic' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Mic size={14} />
              <span className="hidden sm:inline">{t.settings.tabMic}</span>
            </button>
            <button
              onClick={() => { setActiveTab('camera'); mediaSettingsStore.stopMicTest(); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'camera' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Camera size={14} />
              <span className="hidden sm:inline">{t.settings.tabCamera}</span>
            </button>
            <button
              onClick={() => { setActiveTab('account'); stopCamTest(); mediaSettingsStore.stopMicTest(); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'account' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <UserIcon size={14} />
              <span className="hidden sm:inline">{t.settings.tabAccount}</span>
            </button>
            <button
              onClick={() => { setActiveTab('general'); stopCamTest(); mediaSettingsStore.stopMicTest(); }}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'general' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <SettingsIcon size={14} />
              <span className="hidden sm:inline">{t.settings.tabGeneral}</span>
            </button>
          </div>

          {/* TAB A: MICROPHONE */}
          {activeTab === 'mic' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Permission Banner */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    mediaSettingsStore.micPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Mic size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {mediaSettingsStore.micPermission === 'granted' ? t.settings.permGranted : mediaSettingsStore.micPermission === 'denied' ? t.settings.permDenied : t.settings.permPrompt}
                    </div>
                    {mediaSettingsStore.micPermission === 'denied' && (
                      <div className="text-[11px] text-red-400 mt-0.5">{t.settings.permDeniedGuide}</div>
                    )}
                  </div>
                </div>
                {mediaSettingsStore.micPermission !== 'granted' && (
                  <Button size="sm" variant="outline" onClick={() => mediaSettingsStore.requestMicPermission()}>
                    {t.onboarding.allowMic}
                  </Button>
                )}
              </div>

              {/* Mic Master Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)]">{t.settings.micToggle}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">Впливає на голосові кімнати та дуелі</div>
                </div>
                <input
                  type="checkbox"
                  checked={mediaSettings.micEnabled}
                  onChange={(e) => mediaSettingsStore.updateSettings({ micEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Device Selector */}
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-bold block mb-1.5">
                  {t.settings.micDevice}
                </label>
                <select
                  value={mediaSettings.selectedMicId}
                  onChange={(e) => mediaSettingsStore.updateSettings({ selectedMicId: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">За замовчуванням (Системний)</option>
                  {mediaSettingsStore.availableMics.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label || `Мікрофон ${m.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Push-To-Talk Toggle */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-[var(--text-primary)]">{t.settings.pttToggle}</div>
                  <input
                    type="checkbox"
                    checked={mediaSettings.pushToTalk}
                    onChange={(e) => mediaSettingsStore.updateSettings({ pushToTalk: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{t.settings.pttDesc}</p>
              </div>

              {/* Live Mic Test */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.testMic}</span>
                  <Button size="sm" variant={isTestingMic ? 'primary' : 'outline'} onClick={handleToggleMicTest}>
                    {isTestingMic ? t.common.close : t.settings.testMic}
                  </Button>
                </div>
                {isTestingMic && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>{t.settings.testingMic}</span>
                      <span className="font-mono text-[var(--accent)]">{audioLevel}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[var(--bg-subtle)] overflow-hidden border border-[var(--border-subtle)]">
                      <div
                        className="h-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-500 to-[var(--accent)]"
                        style={{ width: `${audioLevel}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB B: VIDEO / CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Permission Banner */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    mediaSettingsStore.cameraPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Camera size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {mediaSettingsStore.cameraPermission === 'granted' ? t.settings.permGranted : mediaSettingsStore.cameraPermission === 'denied' ? t.settings.permDenied : t.settings.permPrompt}
                    </div>
                    {mediaSettingsStore.cameraPermission === 'denied' && (
                      <div className="text-[11px] text-red-400 mt-0.5">{t.settings.permDeniedGuide}</div>
                    )}
                  </div>
                </div>
                {mediaSettingsStore.cameraPermission !== 'granted' && (
                  <Button size="sm" variant="outline" onClick={() => mediaSettingsStore.requestCameraPermission()}>
                    {t.onboarding.allowCamera}
                  </Button>
                )}
              </div>

              {/* Camera Master Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                <div>
                  <div className="font-bold text-xs text-[var(--text-primary)]">{t.settings.cameraToggle}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">Вимкнення активує ручний підрахунок повторів у боях</div>
                </div>
                <input
                  type="checkbox"
                  checked={mediaSettings.cameraEnabled}
                  onChange={(e) => mediaSettingsStore.updateSettings({ cameraEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Camera Selector */}
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-bold block mb-1.5">
                  {t.settings.cameraDevice}
                </label>
                <select
                  value={mediaSettings.selectedCameraId}
                  onChange={(e) => mediaSettingsStore.updateSettings({ selectedCameraId: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">Авто / За замовчуванням</option>
                  {mediaSettingsStore.availableCameras.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || `Камера ${c.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facing Mode & Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => mediaSettingsStore.updateSettings({ facingMode: 'user' })}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    mediaSettings.facingMode === 'user' ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.settings.frontCamera}
                </button>
                <button
                  type="button"
                  onClick={() => mediaSettingsStore.updateSettings({ facingMode: 'environment' })}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    mediaSettings.facingMode === 'environment' ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                  }`}
                >
                  {t.settings.backCamera}
                </button>
              </div>

              {/* Skeleton & Mirror options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.showSkeleton}</span>
                  <input
                    type="checkbox"
                    checked={mediaSettings.showSkeleton}
                    onChange={(e) => mediaSettingsStore.updateSettings({ showSkeleton: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.mirrorVideo}</span>
                  <input
                    type="checkbox"
                    checked={mediaSettings.mirrorVideo}
                    onChange={(e) => mediaSettingsStore.updateSettings({ mirrorVideo: e.target.checked })}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Camera Preview */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.previewTitle}</span>
                  <Button size="sm" variant={isTestingCam ? 'primary' : 'outline'} onClick={handleToggleCamTest}>
                    {isTestingCam ? t.common.close : t.settings.testCamera}
                  </Button>
                </div>
                {isTestingCam && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)]">
                    <video
                      ref={testCamVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${mediaSettings.mirrorVideo ? 'scale-x-[-1]' : ''}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB C: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Profile Nick & Avatar */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="text-xs font-bold text-[var(--text-primary)]">{t.settings.editNickAvatar}</div>
                <div>
                  <input
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    className="w-full bg-[var(--bg-card)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="min-h-11 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-xs font-bold cursor-pointer flex items-center">{avatarUploading?'Завантаження…':'Завантажити фото'}<input type="file" accept="image/*" capture="user" className="hidden" disabled={avatarUploading} onChange={e=>uploadAvatar(e.target.files?.[0])}/></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {avatarsList.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-transform cursor-pointer ${
                        avatar === av ? 'border-[var(--accent)] bg-[var(--accent)]/20 scale-110' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Change (if email account) */}
              {user.email && (
                <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Key size={14} className="text-[var(--accent)]" />
                    <span>{t.settings.changePassword}</span>
                  </div>
                  {passwordFeedback && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${passwordFeedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {passwordFeedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{passwordFeedback.msg}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      placeholder={t.settings.curPass}
                      value={curPassword}
                      onChange={(e) => setCurPassword(e.target.value)}
                      className="bg-[var(--bg-card)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs"
                    />
                    <input
                      type="password"
                      placeholder={t.settings.newPass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[var(--bg-card)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-xs"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="outline">
                    {t.settings.savePass}
                  </Button>
                </form>
              )}

              {/* Active Sessions */}
              {activeSessions.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)]">{t.settings.activeSessions}</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {activeSessions.map((s) => (
                      <div key={s.id} className="text-[11px] text-[var(--text-secondary)] flex justify-between p-1.5 rounded-lg bg-[var(--bg-card)]">
                        <span className="truncate max-w-[200px]">{s.device_info}</span>
                        <span className="font-mono text-[10px]">{s.ip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SolanaWalletCard />

          {/* Export & Data Management */}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={handleExportData} className="flex items-center justify-center gap-1.5">
                  <Download size={14} />
                  <span>{t.settings.exportData}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteDataModal(true)} className="flex items-center justify-center gap-1.5 text-amber-400 border-amber-500/30">
                  <RefreshCw size={14} />
                  <span>{t.settings.deleteData}</span>
                </Button>
              </div>

              {/* Logout & Delete Actions */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowLogoutModal(true)} className="flex items-center gap-1.5">
                  <LogOut size={14} />
                  <span>{t.settings.logoutBtn}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={handleLogoutAll}>
                  {t.settings.logoutAllBtn}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)} className="ml-auto flex items-center gap-1.5">
                  <Trash2 size={14} />
                  <span>{t.settings.deleteAccBtn}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB D: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Language Selector */}
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-bold block mb-1.5">
                  {t.settings.language}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(Object.keys(SUPPORTED_LOCALES) as SupportedLocale[]).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLanguage(loc)}
                      className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        lang === loc ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="text-base">{SUPPORTED_LOCALES[loc].flag}</span>
                      <span className="text-[10px]">{SUPPORTED_LOCALES[loc].name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs text-[var(--text-secondary)] font-bold block mb-1.5">
                  {t.settings.theme}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t.settings.dark}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      theme === 'light' ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t.settings.light}
                  </button>
                </div>
              </div>

              {/* Sounds & Haptics Switches */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.sounds}</span>
                  <input
                    type="checkbox"
                    checked={sound}
                    onChange={(e) => setSound(e.target.checked)}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{t.settings.haptics}</span>
                  <input
                    type="checkbox"
                    checked={haptic}
                    onChange={(e) => setHaptic(e.target.checked)}
                    className="w-5 h-5 accent-[var(--accent)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Onboarding Restart & PWA Install */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <Button size="sm" variant="outline" fullWidth onClick={handleTriggerRestartOnboarding} className="flex items-center justify-center gap-2">
                  <Sparkles size={15} className="text-[var(--accent)]" />
                  <span>{t.settings.restartTour}</span>
                </Button>

                {pwaPrompt && !isPwaInstalled && (
                  <Button size="sm" variant="primary" fullWidth onClick={handlePwaInstall} className="flex items-center justify-center gap-2 font-bold">
                    <Smartphone size={15} />
                    <span>{t.settings.installPwa}</span>
                  </Button>
                )}
                {isPwaInstalled && (
                  <div className="text-center text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>{t.settings.pwaInstalled}</span>
                  </div>
                )}
              </div>

              {/* Version & About */}
              <div className="text-center text-xs text-[var(--text-secondary)]">
                {t.settings.version} • ForgeEngine Core
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
            <Button variant="outline" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" onClick={handleSaveGeneral} className="font-bold flex items-center gap-1.5">
              {saveToast ? <Check size={16} /> : null}
              <span>{saveToast ? t.common.success : t.common.save}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* 1. Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title={t.settings.modalLogoutTitle} maxWidth="sm">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <LogOut size={22} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {authStore.getUser().isGuest ? t.settings.guestLogoutDesc : t.settings.modalLogoutDesc}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setShowLogoutModal(false)}>
                {t.settings.modalStay}
              </Button>
              <Button variant="danger" fullWidth onClick={handleLogout}>
                {t.settings.modalConfirmLogout}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Custom Account Deletion Modal with typed confirmation */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t.settings.modalDeleteTitle} maxWidth="sm">
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{t.settings.modalDeleteDesc}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] block">
                {t.settings.modalTypeDelete}
              </label>
              <input
                type="text"
                placeholder={lang === 'uk' ? 'ВИДАЛИТИ' : 'DELETE'}
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full bg-[var(--bg-subtle)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-xl border border-red-500/40 text-xs font-bold uppercase tracking-wider"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(false)}>
                {t.common.cancel}
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={!['ВИДАЛИТИ', 'DELETE', 'USUŃ', 'LÖSCHEN', 'SUPPRIMER', 'ELIMINAR'].includes(deleteConfirmationInput.trim().toUpperCase())}
                onClick={handleDeleteAccountConfirmed}
              >
                {t.settings.modalConfirmDelete}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Custom Reset Workout History Modal */}
      {showDeleteDataModal && (
        <Modal isOpen={showDeleteDataModal} onClose={() => setShowDeleteDataModal(false)} title={t.settings.deleteData} maxWidth="sm">
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {t.settings.deleteDataConfirm}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setShowDeleteDataModal(false)}>
                {t.common.cancel}
              </Button>
              <Button variant="danger" fullWidth onClick={handleDeleteWorkoutData}>
                {t.common.confirm}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
