import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Crown, 
  TrendingUp, 
  DollarSign, 
  Swords, 
  Dumbbell, 
  ShoppingBag, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Ban, 
  Search, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { BusinessMetrics, UserRole } from '../types';
import { authStore } from '../services/authStore';
import { sound } from '../services/soundEngine';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const currentUser = authStore.getCurrentUser();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, uRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/users')
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    sound.playClick();
    try {
      const token = localStorage.getItem('forgemuscle_auth_token');
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setActionSuccess(`Роль користувача змінено на ${newRole}`);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadAdminData();
      }
    } catch (err) {
      // ignore
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    sound.playClick();
    try {
      const token = localStorage.getItem('forgemuscle_auth_token');
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ isBanned: !currentBanned })
      });
      if (res.ok) {
        setActionSuccess(currentBanned ? 'Акаунт розблоковано' : 'Акаунт заблоковано');
        setTimeout(() => setActionSuccess(null), 3000);
        await loadAdminData();
      }
    } catch (err) {
      // ignore
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-200">
      
      {/* Title & Brand Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Forge Admin & Executive Console (#76, #77)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
            Панель Керування & Business Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Моніторинг активності користувачів, ретеншну, конверсій, модерації та ролей команди
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Оновити метрики</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SECTION 1: BUSINESS ANALYTICS & DAU / WAU / MAU (#77) */}
      <div className="space-y-4">
        <h2 className="text-lg font-black font-heading text-white flex items-center gap-2 uppercase tracking-wide">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          <span>Ключові Бізнес-Метрики (Core Business Analytics)</span>
        </h2>

        {metrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DAU */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <div className="text-xs font-semibold text-neutral-400 flex items-center justify-between">
                <span>Daily Active Users (DAU)</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white font-heading">{metrics.dau}</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <ArrowUpRight className="w-3 h-3" /> +12% за тиждень
              </div>
            </div>

            {/* WAU */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <div className="text-xs font-semibold text-neutral-400 flex items-center justify-between">
                <span>Weekly Active Users (WAU)</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-black text-white font-heading">{metrics.wau}</div>
              <div className="text-[11px] text-neutral-400">
                Коефіцієнт стабільності: 2.6x
              </div>
            </div>

            {/* MAU */}
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <div className="text-xs font-semibold text-neutral-400 flex items-center justify-between">
                <span>Monthly Active Users (MAU)</span>
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white font-heading">{metrics.mau}</div>
              <div className="text-[11px] text-neutral-400">
                Загальний пул активних атлетів
              </div>
            </div>

            {/* Revenue */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-neutral-900/80 to-neutral-900/80 border border-amber-500/30 space-y-1">
              <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                <span>Monthly Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-400 font-heading">
                {metrics.monthlyGrossRevenueUah.toLocaleString()} ₴
              </div>
              <div className="text-[11px] text-neutral-300">
                {metrics.premiumSubscribersCount} Premium + {metrics.totalMarketplacePurchases} маркет-покупок
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* SECTION 2: RETENTION & ACTIVATION FUNNEL (#78) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activation & Funnel */}
        <div className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Воронка Активації (Activation Funnel)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              {metrics?.activationRate}% конверсія
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-neutral-300 mb-1 font-semibold">
                <span>1. Google / Email Реєстрація</span>
                <span className="text-white font-bold">{metrics?.totalRegistrations || 100}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1 font-semibold">
                <span>2. Завершення 6 кроків Онбордингу</span>
                <span className="text-white font-bold">88.2%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '88.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-300 mb-1 font-semibold">
                <span>3. Перше тренування / підрахунок репів</span>
                <span className="text-white font-bold">{metrics?.activationRate || 78.4}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics?.activationRate || 78.4}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Cohort Retention (#78) */}
        <div className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Утримання Користувачів (User Retention)</span>
            </h3>
            <span className="text-xs text-neutral-400">Повернення в Кузню</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-[11px] text-neutral-400 font-bold uppercase">Day 1</div>
              <div className="text-2xl font-black text-amber-400 font-heading">
                {metrics?.retentionDay1 || 64.2}%
              </div>
              <div className="text-[10px] text-neutral-500">Повернення на 2-й день</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-[11px] text-neutral-400 font-bold uppercase">Day 7</div>
              <div className="text-2xl font-black text-cyan-400 font-heading">
                {metrics?.retentionDay7 || 48.5}%
              </div>
              <div className="text-[10px] text-neutral-500">Тижневий цикл</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="text-[11px] text-neutral-400 font-bold uppercase">Day 30</div>
              <div className="text-2xl font-black text-purple-400 font-heading">
                {metrics?.retentionDay30 || 36.8}%
              </div>
              <div className="text-[10px] text-neutral-500">Місячна звичка</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: USER MANAGEMENT & ROLE ASSIGNMENT (#75, #76) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black font-heading text-white flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Керування Користувачами та Ролями (#75)</span>
            </h2>
            <p className="text-xs text-neutral-400">
              USER, CREATOR, MODERATOR, ADMIN, VERIFIED CREATOR
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Пошук за username/email..."
                className="bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 w-52"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Всі ролі</option>
              <option value="USER">USER</option>
              <option value="CREATOR">CREATOR</option>
              <option value="VERIFIED_CREATOR">VERIFIED CREATOR</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                <tr>
                  <th className="p-4">Атлет</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Роль (#75)</th>
                  <th className="p-4">Рівень & XP</th>
                  <th className="p-4">Дисципліна</th>
                  <th className="p-4">Статус</th>
                  <th className="p-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-neutral-850/40 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40 shrink-0">
                        <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.username}</span>
                          {u.isPremium && <Crown className="w-3 h-3 text-amber-400" />}
                        </div>
                        <div className="text-[10px] text-neutral-400">{u.displayName}</div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-neutral-400">
                      {u.email}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={e => handleUpdateRole(u.id, e.target.value as UserRole)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none ${
                          u.role === 'ADMIN'
                            ? 'bg-red-950/40 border-red-500/40 text-red-300'
                            : u.role === 'VERIFIED_CREATOR' || u.role === 'CREATOR'
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                            : u.role === 'MODERATOR'
                            ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <option value="USER">USER</option>
                        <option value="CREATOR">CREATOR</option>
                        <option value="VERIFIED_CREATOR">VERIFIED CREATOR</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-amber-400">Lvl {u.level}</span>
                      <span className="text-neutral-500 ml-1">({u.xp} XP)</span>
                    </td>

                    <td className="p-4 capitalize">
                      {u.discipline || 'hybrid'}
                    </td>

                    <td className="p-4">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/40">
                          Заблокований
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                          Активний
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          u.isBanned
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                            : 'border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-900/40'
                        }`}
                      >
                        {u.isBanned ? 'Розблокувати' : 'Заблокувати'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

function Globe(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
    </svg>
  );
}
