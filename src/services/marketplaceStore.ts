import {
  MarketplaceProduct,
  CreatorProfile,
  CosmeticItem,
  PartnerSponsorship
} from '../types';
import { sound } from './soundEngine';
import { arnoVoice } from './arnoVoice';

export const SEED_MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod_ppl_12week',
    creatorId: 'user_maks',
    creatorName: 'Максим «Титановий»',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
    title: '12-тижневий цикл Hypertrophy PPL (Push-Pull-Legs)',
    description: 'Систематизований науковий протокол прогресивного перевантаження для набору якісної мʼязової маси без перевантаження хребта.',
    type: 'workout_plan',
    discipline: 'bodybuilding',
    priceUah: 290,
    rating: 4.95,
    reviewsCount: 38,
    salesCount: 142,
    badge: 'Топ Продажів 🔥',
    tags: ['бодибілдинг', 'PPL', 'гіпертрофія', 'штанга'],
    previewBullets: [
      '3-х денний або 6-ти денний спліт на вибір',
      'Таблиця прогресії робочих ваг з RPE та RIR',
      'Відеоінструкції правильної траєкторії ліктів',
      'Блок періодизації та розвантажувальних тижнів (Deload)'
    ],
    isPurchasedByMe: false,
    isVerified: true
  },
  {
    id: 'prod_planche_frontlever',
    creatorId: 'user_taras',
    creatorName: 'Тарас «Залізо»',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    title: 'Від нуля до Переднього Вису (Front Lever) та Горизонту',
    description: 'Покроковий атлетичний гайд зміцнення звʼязок ліктів, найширших та кора для складних статичних елементів калістеніки.',
    type: 'technique_guide',
    discipline: 'calisthenics',
    priceUah: 250,
    rating: 4.98,
    reviewsCount: 44,
    salesCount: 189,
    badge: 'Вибір Наставників ⚔️',
    tags: ['калістеніка', 'передній вис', 'статика', 'турнік'],
    previewBullets: [
      'Тест готовності сухожиль до навантаження',
      'Прогресії з гумовими петлями різного опору',
      'Спеціальні вправи на драконячий прапор і hollow-body',
      'Захист ліктьового суглоба від тендиніту'
    ],
    isPurchasedByMe: true,
    isVerified: true
  },
  {
    id: 'prod_home_iron',
    creatorId: 'user_artur',
    creatorName: 'Артур_Новак',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
    title: 'Домашній Атлет: Набір Маси з Парою Гантелей та Турніком',
    description: 'Повноцінна програма на випадок відсутності доступу до спортзалу. Максимальна віддача від мінімального простору.',
    type: 'workout_plan',
    discipline: 'hybrid',
    priceUah: 180,
    rating: 4.88,
    reviewsCount: 22,
    salesCount: 95,
    tags: ['домашній зал', 'гантелі', 'турнік', 'економія часу'],
    previewBullets: [
      'Інтенсивні суперсети з мінімальним обладнанням',
      'Варіації темпу для компенсації невеликої ваги',
      'Програма на 45 хвилин у день'
    ],
    isPurchasedByMe: false,
    isVerified: true
  }
];

export const SEED_COSMETICS: CosmeticItem[] = [
  // Frames
  { id: 'frame_copper', name: 'Мідна Оправа', type: 'frame', costPoints: 300, previewColor: '#b45309', rarity: 'common', description: 'Перша оправа підмайстра з гартованої міді', isPurchased: true, isEquipped: true },
  { id: 'frame_steel', name: 'Дамаська Сталь', type: 'frame', costPoints: 800, previewColor: '#38bdf8', rarity: 'rare', description: 'Візерункове коване лезо навколо аватара', isPurchased: false },
  { id: 'frame_molten', name: 'Розпечена Лава', type: 'frame', costPoints: 1500, previewColor: '#f97316', rarity: 'epic', description: 'Палаюча магма з іскрами кузні', isPurchased: false },
  { id: 'frame_obsidian', name: 'Обсидіановий Моноліт', type: 'frame', costPoints: 3000, previewColor: '#a855f7', rarity: 'legendary', description: 'Рідкісний темний кришталь для справжніх титанів', isPurchased: false },

  // Auras / Effects
  { id: 'effect_sparks', name: 'Іскри Ковадла', type: 'effect', costPoints: 400, previewIcon: '✨', rarity: 'common', description: 'Золотисті іскри навколо іконки аватара', isPurchased: true, isEquipped: true },
  { id: 'effect_steam', name: 'Пара Гартування', type: 'effect', costPoints: 900, previewIcon: '💨', rarity: 'rare', description: 'Охолодження щойно викуваного заліза у воді', isPurchased: false },
  { id: 'effect_fire', name: 'Вогняний Ореол', type: 'effect', costPoints: 2000, previewIcon: '🔥', rarity: 'epic', description: 'Пульсуюче полумʼя внутрішньої сили', isPurchased: false },

  // Titles
  { id: 'title_smith', name: 'Коваль Сталі', type: 'title', costPoints: 200, rarity: 'common', description: 'Початковий почесний титул атлета', isPurchased: true, isEquipped: true },
  { id: 'title_bar_titan', name: 'Титан Турніків', type: 'title', costPoints: 600, rarity: 'rare', description: 'Здобувається майстрами підтягувань', isPurchased: false },
  { id: 'title_iron_beast', name: 'Залізний Звір', type: 'title', costPoints: 1200, rarity: 'epic', description: 'Титул невгамовних любителів штанги', isPurchased: false }
];

export const SEED_SPONSORSHIPS: PartnerSponsorship[] = [
  {
    id: 'spon_steelwear',
    partnerName: 'SteelWear UA',
    logo: '🛡️',
    title: 'Компресійний та спортивний одяг для тренувань',
    description: 'Анатомічний крій, посилені шви для важких підходів та повітропроникні тканини. Знижка 15% для атлетів Forge.',
    discountCode: 'FORGE15',
    category: 'apparel',
    link: 'https://forgemuscle.app/partners/steelwear',
    badge: 'Офіційний партнер'
  },
  {
    id: 'spon_ironbar',
    partnerName: 'TitanGrip Equip',
    logo: '⚙️',
    title: 'Магнезія, кистьові бинти та гімнастичні кільця',
    description: 'Сертифікований спортивний інвентар для калістеніки та бодибілдингу. Надійне зчеплення з перекладиною.',
    discountCode: 'TITANGRIP',
    category: 'equipment',
    link: 'https://forgemuscle.app/partners/titangrip',
    badge: 'Схвалено Кузнею'
  }
];

class MarketplaceStore {
  private products: MarketplaceProduct[] = SEED_MARKETPLACE_PRODUCTS;
  private cosmetics: CosmeticItem[] = SEED_COSMETICS;
  private sponsorships: PartnerSponsorship[] = SEED_SPONSORSHIPS;
  private myCreatorProfile: CreatorProfile;
  private forgePoints: number = 650;
  private isPremiumUser: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.myCreatorProfile = {
      id: 'cr_me',
      userId: 'user_me',
      displayName: 'Ви (Атлет Кузні)',
      bio: 'Практик гібридного атлетизму, дослідник чистих виходів силою та збалансованого обсягу.',
      creatorLevel: 2,
      reputationRank: 'Fighter',
      specialties: ['Калістеніка', 'Гібрид', 'Прогресії для новачків'],
      publishedItemsCount: 1,
      averageRating: 4.9,
      followersCount: 34,
      totalSalesCount: 12,
      earningsBalance: 1840,
      isVerifiedCreator: true
    };
    this.load();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private load() {
    try {
      const savedProds = localStorage.getItem('forgemuscle_products');
      if (savedProds) this.products = JSON.parse(savedProds);

      const savedCosmetics = localStorage.getItem('forgemuscle_cosmetics');
      if (savedCosmetics) this.cosmetics = JSON.parse(savedCosmetics);

      const savedPoints = localStorage.getItem('forgemuscle_points');
      if (savedPoints) this.forgePoints = parseInt(savedPoints, 10);

      const savedPrem = localStorage.getItem('forgemuscle_is_premium');
      if (savedPrem) this.isPremiumUser = savedPrem === 'true';
    } catch {
      // fallback
    }
  }

  private save() {
    try {
      localStorage.setItem('forgemuscle_products', JSON.stringify(this.products));
      localStorage.setItem('forgemuscle_cosmetics', JSON.stringify(this.cosmetics));
      localStorage.setItem('forgemuscle_points', this.forgePoints.toString());
      localStorage.setItem('forgemuscle_is_premium', this.isPremiumUser.toString());
    } catch {
      // ignore
    }
    this.notify();
  }

  public getProducts(): MarketplaceProduct[] {
    return this.products;
  }

  public getCosmetics(): CosmeticItem[] {
    return this.cosmetics;
  }

  public getSponsorships(): PartnerSponsorship[] {
    return this.sponsorships;
  }

  public getCreatorProfile(): CreatorProfile {
    return this.myCreatorProfile;
  }

  public getForgePoints(): number {
    return this.forgePoints;
  }

  public getIsPremium(): boolean {
    return this.isPremiumUser;
  }

  public togglePremium() {
    this.isPremiumUser = !this.isPremiumUser;
    this.save();
    sound.playLevelUp();
    arnoVoice.speak(this.isPremiumUser ? 'Активовано Forge Premium! Усі розширені модулі та преміальні програми відкриті.' : 'Повернуто базовий статус.');
  }

  public purchaseProduct(productId: string): boolean {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod || prod.isPurchasedByMe) return false;

    // Simulation of payment success via secure external gateway
    prod.isPurchasedByMe = true;
    prod.salesCount += 1;
    this.forgePoints += 50; // Bonus points for supporting creator
    this.save();
    sound.playTrophy();
    arnoVoice.speak(`Матеріал «${prod.title}» успішно додано до вашої бібліотеки знань!`);
    return true;
  }

  public buyCosmetic(cosmeticId: string): boolean {
    const item = this.cosmetics.find((c) => c.id === cosmeticId);
    if (!item || item.isPurchased) return false;

    if (this.forgePoints < item.costPoints) {
      sound.playClick();
      arnoVoice.speak('Недостатньо Forge Points. Виконуйте більше тренувань та квестів!');
      return false;
    }

    this.forgePoints -= item.costPoints;
    item.isPurchased = true;
    this.equipCosmetic(cosmeticId);
    this.save();
    sound.playTrophy();
    return true;
  }

  public equipCosmetic(cosmeticId: string) {
    const target = this.cosmetics.find((c) => c.id === cosmeticId);
    if (!target || !target.isPurchased) return;

    // Unequip others of same type
    this.cosmetics.forEach((c) => {
      if (c.type === target.type) {
        c.isEquipped = c.id === target.id;
      }
    });

    this.save();
    sound.playClick();
    arnoVoice.speak(`Предмет «${target.name}» екіпіровано!`);
  }

  public publishProduct(data: {
    title: string;
    description: string;
    type: MarketplaceProduct['type'];
    discipline: MarketplaceProduct['discipline'];
    priceUah: number;
    previewBullets: string[];
    tags: string[];
  }): MarketplaceProduct {
    const newProd: MarketplaceProduct = {
      id: `prod_${Date.now()}`,
      creatorId: 'user_me',
      creatorName: this.myCreatorProfile.displayName,
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
      title: data.title,
      description: data.description,
      type: data.type,
      discipline: data.discipline,
      priceUah: data.priceUah,
      rating: 5.0,
      reviewsCount: 1,
      salesCount: 0,
      tags: data.tags,
      previewBullets: data.previewBullets,
      isPurchasedByMe: true,
      isVerified: true
    };

    this.products.unshift(newProd);
    this.myCreatorProfile.publishedItemsCount += 1;
    this.save();
    sound.playTrophy();
    arnoVoice.speak(`Ваш авторський матеріал «${data.title}» опубліковано у Forge Marketplace!`);
    return newProd;
  }
}

export const marketplaceStore = new MarketplaceStore();
