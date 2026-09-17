import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Award,
  Star,
  CheckCircle,
  Plus,
  ShieldCheck,
  CreditCard,
  Crown,
  ExternalLink,
  Flame,
  Tag,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Check
} from 'lucide-react';
import { marketplaceStore } from '../services/marketplaceStore';
import {
  MarketplaceProduct,
  CreatorProfile,
  CosmeticItem,
  PartnerSponsorship
} from '../types';
import { sound } from '../services/soundEngine';
import { arnoVoice } from '../services/arnoVoice';

interface ForgeMarketplaceStoreProps {
  initialTab?: 'marketplace' | 'cosmetics' | 'premium' | 'creator_hub';
}

export const ForgeMarketplaceStore: React.FC<ForgeMarketplaceStoreProps> = ({ initialTab = 'marketplace' }) => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'cosmetics' | 'premium' | 'creator_hub'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [products, setProducts] = useState<MarketplaceProduct[]>(marketplaceStore.getProducts());
  const [cosmetics, setCosmetics] = useState<CosmeticItem[]>(marketplaceStore.getCosmetics());
  const [sponsorships, setSponsorships] = useState<PartnerSponsorship[]>(marketplaceStore.getSponsorships());
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>(marketplaceStore.getCreatorProfile());
  const [points, setPoints] = useState<number>(marketplaceStore.getForgePoints());
  const [isPremium, setIsPremium] = useState<boolean>(marketplaceStore.getIsPremium());

  // Filter products by discipline
  const [filterDiscipline, setFilterDiscipline] = useState<'all' | 'bodybuilding' | 'calisthenics' | 'hybrid'>('all');

  // Checkout modal
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Publish product modal
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubPrice, setPubPrice] = useState(240);
  const [pubType, setPubType] = useState<MarketplaceProduct['type']>('workout_plan');
  const [pubDiscipline, setPubDiscipline] = useState<MarketplaceProduct['discipline']>('calisthenics');
  const [pubBullets, setPubBullets] = useState('Анатомічний прогрес без болю\nСпеціальні сети на звʼязки\nВідеорозбір');
  const [pubTags, setPubTags] = useState('калістеніка, баланс, прогрес');

  useEffect(() => {
    const unsub = marketplaceStore.subscribe(() => {
      setProducts([...marketplaceStore.getProducts()]);
      setCosmetics([...marketplaceStore.getCosmetics()]);
      setSponsorships([...marketplaceStore.getSponsorships()]);
      setCreatorProfile({ ...marketplaceStore.getCreatorProfile() });
      setPoints(marketplaceStore.getForgePoints());
      setIsPremium(marketplaceStore.getIsPremium());
    });
    return () => unsub();
  }, []);

  const handleBuyProduct = (prod: MarketplaceProduct) => {
    sound.playClick();
    setSelectedProduct(prod);
    setCheckoutSuccess(false);
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct) return;
    setIsProcessingPay(true);

    setTimeout(() => {
      marketplaceStore.purchaseProduct(selectedProduct.id);
      setIsProcessingPay(false);
      setCheckoutSuccess(true);
    }, 1200);
  };

  const handleBuyCosmetic = (id: string) => {
    marketplaceStore.buyCosmetic(id);
  };

  const handleEquipCosmetic = (id: string) => {
    marketplaceStore.equipCosmetic(id);
  };

  const handleTogglePremium = () => {
    marketplaceStore.togglePremium();
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubDesc.trim()) return;

    marketplaceStore.publishProduct({
      title: pubTitle,
      description: pubDesc,
      priceUah: pubPrice,
      type: pubType,
      discipline: pubDiscipline,
      previewBullets: pubBullets.split('\n').filter((b) => b.trim()),
      tags: pubTags.split(',').map((t) => t.trim())
    });

    setShowPublishModal(false);
    setPubTitle('');
    setPubDesc('');
  };

  const filteredProducts = products.filter((p) => {
    if (filterDiscipline === 'all') return true;
    return p.discipline === filterDiscipline;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Forge Ecosystem Market
            </span>
            <span className="text-xs text-neutral-400">Цифрова економіка атлетів & безпечні матеріали</span>
          </div>
          <h1 className="text-3xl font-extrabold font-epic tracking-wide text-neutral-100">
            MARKET & CREATORS
          </h1>
        </div>

        {/* Forge Points & Currency Bar */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold block leading-none">Forge Points</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono leading-none">{points} FP</span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('premium')}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPremium
                ? 'border-amber-400 bg-amber-500 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-900/30'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>{isPremium ? 'Forge Premium (Активний)' : 'Отримати Premium'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'marketplace', label: 'Цифровий Маркетплейс', icon: Package },
          { id: 'cosmetics', label: 'Кузня Косметики & Аватари', icon: Sparkles },
          { id: 'creator_hub', label: 'Кабінет Автора & Заробіток', icon: DollarSign },
          { id: 'premium', label: 'Forge Premium Тарифи', icon: Crown }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Digital Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Дисципліна:</span>
              {[
                { id: 'all', label: 'Всі' },
                { id: 'bodybuilding', label: '🏋️ Залізо' },
                { id: 'calisthenics', label: '🤸 Турніки' },
                { id: 'hybrid', label: '🔥 Гібрид' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterDiscipline(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterDiscipline === f.id
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPublishModal(true)}
              className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Опублікувати Авторську Програму
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg"
              >
                <div>
                  {/* Creator Info & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-neutral-700">
                        <img src={prod.creatorAvatar} alt={prod.creatorName} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-neutral-300 truncate">{prod.creatorName}</span>
                    </div>
                    {prod.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-neutral-100 leading-snug">
                    {prod.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-3">
                    {prod.description}
                  </p>

                  {/* Highlights */}
                  <ul className="mt-4 space-y-1 text-xs text-neutral-300">
                    {prod.previewBullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {prod.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Price & Purchase */}
                <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-neutral-500 text-[10px]">({prod.reviewsCount})</span>
                    </div>
                    <div className="text-lg font-extrabold text-neutral-100 mt-0.5 font-mono">
                      {prod.priceUah} ₴
                    </div>
                  </div>

                  {prod.isPurchasedByMe ? (
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> У бібліотеці
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuyProduct(prod)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
                    >
                      Отримати доступ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* SPONSORSHIPS / PARTNERS (Transparent & Clearly Marked) */}
          <div className="mt-12 pt-8 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-500">
                Спонсорські Інтеграції (Sponsored)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                Перевірені спортивні бренди
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sponsorships.map((spon) => (
                <div
                  key={spon.id}
                  className="rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-neutral-900 border border-neutral-800">{spon.logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-neutral-200">{spon.partnerName}</h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          {spon.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">{spon.title}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">
                      Код: {spon.discountCode}
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        arnoVoice.speak(`Промокод ${spon.discountCode} скопійовано!`);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-amber-300 underline mt-1"
                    >
                      Копіювати код
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cosmetics & Avatar Upgrades */}
      {activeTab === 'cosmetics' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Візуальна Кастомізація Аватара
              </span>
              <h2 className="text-2xl font-extrabold text-neutral-100 mt-1">
                Кузня Оправ, Аур та Титулів
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl">
                Косметичні предмети не дають переваги у тренуваннях, але підкреслюють ваш досвід, дисципліну та статус у чатах і батлах.
              </p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-neutral-900 border border-amber-500/40 text-center">
              <span className="text-xs text-neutral-400 font-medium block">Ваш Баланс</span>
              <span className="text-2xl font-black text-amber-300 font-mono">{points} FP</span>
              <span className="text-[10px] text-neutral-500 block mt-1">+50 FP за кожне тренування</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cosmetics.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-950 text-neutral-400 border border-neutral-800">
                      {item.type}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      item.rarity === 'legendary'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.rarity === 'epic'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : item.rarity === 'rare'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {item.rarity}
                    </span>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="h-24 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center my-3 relative overflow-hidden">
                    {item.previewColor && (
                      <div
                        className="w-16 h-16 rounded-full border-4 shadow-lg flex items-center justify-center font-bold text-xs"
                        style={{ borderColor: item.previewColor }}
                      >
                        AVATAR
                      </div>
                    )}
                    {item.previewIcon && (
                      <span className="text-4xl animate-pulse">{item.previewIcon}</span>
                    )}
                    {item.type === 'title' && (
                      <span className="text-sm font-bold text-amber-300 italic px-3 py-1 bg-neutral-900 border border-amber-500/30 rounded-lg">
                        «{item.name}»
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-neutral-100">{item.name}</h4>
                  <p className="text-xs text-neutral-400 mt-1">{item.description}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {item.isPurchased ? 'Куплено' : `${item.costPoints} FP`}
                  </span>

                  {item.isPurchased ? (
                    item.isEquipped ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Екіпіровано
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEquipCosmetic(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
                      >
                        Одягнути
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleBuyCosmetic(item.id)}
                      disabled={points < item.costPoints}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      Розблокувати
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Creator Hub & Digital Earnings */}
      {activeTab === 'creator_hub' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Creator Metrics */}
            <div className="rounded-3xl border border-amber-500/30 bg-neutral-900/80 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/50">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces"
                    alt={creatorProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">{creatorProfile.displayName}</h3>
                  <span className="text-xs text-amber-400 font-semibold">Сертифікований автор Forge</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {creatorProfile.bio}
              </p>
              <div className="pt-2 border-t border-neutral-800 space-y-1 text-xs text-neutral-300">
                <div className="flex justify-between">
                  <span>Рейтинг матеріалів:</span>
                  <span className="text-amber-400 font-bold">⭐ {creatorProfile.averageRating}</span>
                </div>
                <div className="flex justify-between">
                  <span>Підписників:</span>
                  <span className="font-bold">{creatorProfile.followersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Опубліковано гайдів:</span>
                  <span className="font-bold">{creatorProfile.publishedItemsCount}</span>
                </div>
              </div>
            </div>

            {/* Financial Balance Card */}
            <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900/80 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  Фінансовий Баланс Автора
                </span>
                <div className="text-3xl font-black text-neutral-100 font-mono mt-1">
                  {creatorProfile.earningsBalance} ₴
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  Комісія платформи: 15% (на сервери та розвиток кузні). 85% доходу перераховується автору.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => {
                    sound.playClick();
                    arnoVoice.speak('Запит на виведення коштів надіслано до банківського шлюзу.');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  Вивести на банківську картку (IBAN)
                </button>
              </div>
            </div>

            {/* Quality Standard Card */}
            <div className="rounded-3xl border border-cyan-500/30 bg-neutral-900/80 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider block mb-1">
                  Стандарти Модерації Forge
                </span>
                <h4 className="text-sm font-bold text-neutral-100">Безпечний авторський контент</h4>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Будь-які програми з небезпечними вправами (наприклад, ривки на холодні звʼязки, екстремальне голодування) відхиляються. Дозволені лише науково перевірені методики.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="w-full py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Створити новий гайд
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Forge Premium */}
      {activeTab === 'premium' && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Forge Premium Membership
            </span>
            <h2 className="text-3xl font-black text-neutral-100 font-epic">
              Оберіть свій рівень доступу
            </h2>
            <p className="text-xs text-neutral-400">
              Базовий функціонал тренувань і бази вправ залишається 100% безкоштовним назавжди. Преміум розблоковує поглиблену аналітику та необмежений функціонал.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Free Tier</span>
                <h3 className="text-2xl font-bold text-neutral-100 mt-1">Атлет Кузні</h3>
                <div className="text-3xl font-extrabold text-neutral-100 font-mono mt-3">
                  0 ₴ <span className="text-xs text-neutral-500 font-normal">/ назавжди</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Базова генерація у Forge Engine (до 3 на день)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Камера-трекер та підрахунок повторень
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Участь у Битві Таборів (Battle Mode)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Доступ до Forge Community та Ask the Forge
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  disabled={!isPremium}
                  onClick={handleTogglePremium}
                  className="w-full py-3 rounded-2xl bg-neutral-800 text-neutral-400 text-xs font-bold cursor-pointer"
                >
                  {!isPremium ? 'Поточний тариф' : 'Перейти на Free'}
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-3xl border-2 border-amber-500 bg-gradient-to-b from-amber-950/20 to-neutral-900 p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(245,158,11,0.2)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Titan Pass</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-black">
                    РЕКОМЕНДОВАНО
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-100 mt-1">Forge Premium</h3>
                <div className="text-3xl font-extrabold text-amber-300 font-mono mt-3">
                  199 ₴ <span className="text-xs text-neutral-400 font-normal">/ місяць</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-neutral-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    Необмежена генерація тренувань у Forge Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    Поглиблена аналітика кутів рухів та кінематики
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    Ексклюзивні аури аватара та титули
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    Пріоритетне розміщення питань в Ask the Forge
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    20% знижка на всі авторські гайди в маркеті
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-neutral-800">
                <button
                  onClick={handleTogglePremium}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-xs font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                >
                  {isPremium ? 'Скасувати підписку (Симуляція)' : 'Активувати Forge Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal (Simulated Payment Gateway) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-neutral-950 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-neutral-100">Безпечний платіж</h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-neutral-500 hover:text-neutral-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-neutral-100">Оплату успішно підтверджено!</h4>
                <p className="text-xs text-neutral-400">
                  Матеріал додано до вашого кабінету. Ви також отримали +50 Forge Points.
                </p>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold cursor-pointer"
                >
                  Перейти до матеріалів
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-neutral-100">{selectedProduct.title}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Автор: {selectedProduct.creatorName}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex justify-between items-center text-xs">
                  <span className="text-neutral-300">До сплати:</span>
                  <span className="text-base font-extrabold text-amber-300 font-mono">{selectedProduct.priceUah} ₴</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-neutral-400 font-medium block">Оберіть платіжний метод:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2.5 rounded-xl border border-amber-500/30 bg-neutral-900 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      Apple / GPay
                    </button>
                    <button className="py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5">
                      Картка Visa/MC
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-400 text-xs"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isProcessingPay}
                    className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {isProcessingPay ? 'Обробка...' : `Сплатити ${selectedProduct.priceUah} ₴`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <form
            onSubmit={handlePublishSubmit}
            className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-neutral-950 p-6 sm:p-8 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">Опублікувати Авторський Гайд</h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-neutral-500 hover:text-neutral-200 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Назва програми / гайду</label>
              <input
                type="text"
                value={pubTitle}
                onChange={(e) => setPubTitle(e.target.value)}
                placeholder="напр. 8 тижнів вибухових підтягувань..."
                className="w-full bg-neutral-900 text-xs text-neutral-100 px-3.5 py-2.5 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Короткий опис</label>
              <textarea
                value={pubDesc}
                onChange={(e) => setPubDesc(e.target.value)}
                placeholder="Для кого цей гайд і яких результатів очікувати..."
                rows={2}
                className="w-full bg-neutral-900 text-xs text-neutral-100 px-3.5 py-2 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Вартість (UAH)</label>
                <input
                  type="number"
                  value={pubPrice}
                  onChange={(e) => setPubPrice(Number(e.target.value))}
                  className="w-full bg-neutral-900 text-xs text-neutral-100 px-3.5 py-2 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
                  min={50}
                  max={5000}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Дисципліна</label>
                <select
                  value={pubDiscipline}
                  onChange={(e) => setPubDiscipline(e.target.value as any)}
                  className="w-full bg-neutral-900 text-xs text-neutral-100 px-3 py-2 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
                >
                  <option value="calisthenics">Калістеніка</option>
                  <option value="bodybuilding">Бодибілдинг</option>
                  <option value="hybrid">Гібрид</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Ключові тези (по одній на рядок)</label>
              <textarea
                value={pubBullets}
                onChange={(e) => setPubBullets(e.target.value)}
                rows={2}
                className="w-full bg-neutral-900 text-xs text-neutral-100 px-3.5 py-2 rounded-xl border border-neutral-800 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-400 text-xs"
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold"
              >
                Опублікувати (85% автору)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
