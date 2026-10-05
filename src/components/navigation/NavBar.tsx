import React from 'react';
import { BookOpen, Swords, MessageSquare, Trophy, User, Settings } from 'lucide-react';
import { useI18n } from '../../services/i18n';

export type NavTabId = 'home' | 'battle' | 'chat' | 'leaderboard' | 'profile';

export interface NavBarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onOpenSettings?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange, onOpenSettings }) => {
  const { t } = useI18n();

  const items = [
    { id: 'home' as const, label: t.nav.home, icon: BookOpen },
    { id: 'battle' as const, label: t.nav.battle, icon: Swords },
    { id: 'chat' as const, label: t.nav.chat, icon: MessageSquare },
    { id: 'leaderboard' as const, label: t.nav.leaderboard, icon: Trophy },
    { id: 'profile' as const, label: t.nav.profile, icon: User }
  ];

  return (
    <>
      {/* Desktop Sidebar (Left column) */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] p-5 shrink-0 min-h-screen fixed top-0 left-0 bottom-0 z-40 justify-between">
        <div className="space-y-6">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B0D11] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-md">
                <img
                  src="/logo.png"
                  alt="ForgeMuscle"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-heading font-black text-lg tracking-tight text-[var(--text-primary)]">
                  FORGE<span className="text-[var(--accent)]">MUSCLE</span>
                </span>
                <div className="text-[10px] text-[var(--text-secondary)] font-mono -mt-1">
                  Кузня Твого Тіла
                </div>
              </div>
            </div>

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                aria-label={t.settings.title}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5" id="nav-main-links">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-md font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom OS Version Tag & Settings Quick Link */}
        <div className="space-y-2">
          {onOpenSettings && (
            <button
              id="nav-settings-btn"
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <Settings size={16} />
              <span>{t.nav.settings}</span>
            </button>
          )}
          <div className="px-3 py-2.5 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              MediaPipe Pose v1.0
            </div>
            <div className="text-[10px] mt-0.5">Верифікація амплітуди &gt;85% ROM</div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-1.5 flex justify-around items-center" id="mobile-nav-bar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all cursor-pointer select-none ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-[var(--accent)]/15' : ''
                }`}
              >
                <Icon size={20} />
              </div>
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
