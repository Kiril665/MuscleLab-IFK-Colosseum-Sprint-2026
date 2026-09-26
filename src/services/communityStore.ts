/**
 * ForgeMuscle Community, Wiki, Q&A, Guilds, and Reputation Store
 * Fully reactive with localStorage persistence and rich athletic seed data.
 */

import {
  CommunityPost,
  PostComment,
  AskQuestion,
  QuestionAnswer,
  Guild,
  DailyQuest,
  WeeklyChallenge,
  RandomChallenge,
  UserProfile,
  WikiArticle,
  MythFactItem,
  ReputationRank,
  ReputationRankInfo,
  ForgeScoreBreakdown,
  ModerationReport,
  ChallengeRarity,
  Discipline
} from '../types';
import { sound } from './soundEngine';
import { authStore } from './authStore';

export const REPUTATION_RANKS: ReputationRankInfo[] = [
  { rank: 'Newcomer', minPoints: 0, title: 'Новачок Кузні', color: 'text-neutral-400', badge: '🌱', description: 'Перші кроки в спортивній спільноті' },
  { rank: 'Helper', minPoints: 100, title: 'Помічник', color: 'text-cyan-400', badge: '🛡️', description: 'Активно ділиться базовими порадами з атлетами' },
  { rank: 'Fighter', minPoints: 300, title: 'Боєць', color: 'text-emerald-400', badge: '⚔️', description: 'Досвідчений практик, дає точні технічні відповіді' },
  { rank: 'Mentor', minPoints: 700, title: 'Наставник', color: 'text-amber-400', badge: '🔥', description: 'Визнаний експерт з підтвердженими Best Answers' },
  { rank: 'Master', minPoints: 1500, title: 'Майстер Сталі', color: 'text-orange-400', badge: '⚡', description: 'Лідер напрямку, створює фундаментальні гайди' },
  { rank: 'Legend', minPoints: 3000, title: 'Легенда Forge', color: 'text-yellow-300', badge: '👑', description: 'Вища репутація в Кузні за вагомий внесок' }
];

export function getReputationRank(points: number): ReputationRank {
  if (points >= 3000) return 'Legend';
  if (points >= 1500) return 'Master';
  if (points >= 700) return 'Mentor';
  if (points >= 300) return 'Fighter';
  if (points >= 100) return 'Helper';
  return 'Newcomer';
}

const SEED_POSTS: CommunityPost[] = [];

const SEED_QUESTIONS: AskQuestion[] = [];

const SEED_GUILDS: Guild[] = [
  {
    id: 'guild_iron',
    name: 'Iron Forge (Сталеве Ковадло)',
    description: 'Оплот важкого заліза, паверліфтингу та класичного бодибілдингу. Куємо силу крізь тонни металу.',
    motto: 'Сталь підкорюється волі!',
    icon: '🏋️',
    disciplineFocus: 'bodybuilding',
    membersCount: 284,
    totalXp: 48900,
    level: 7,
    leaderName: 'Iron Guildmaster',
    activeChallenge: 'Спільний жим 50 000 кг за тиждень',
    isJoinedByMe: false
  },
  {
    id: 'guild_cali',
    name: 'Calisthenics Elite (Вільний Політ)',
    description: 'Майстри перекладин, брусів та контролю над власною гравітацією. Виходи силою, планш, прапорець.',
    motto: 'Твоє тіло — твоя єдина зброя!',
    icon: '🤸',
    disciplineFocus: 'calisthenics',
    membersCount: 342,
    totalXp: 62400,
    level: 9,
    leaderName: 'Calisthenics Lead',
    activeChallenge: '10 000 чистих підтягувань братством',
    isJoinedByMe: true
  },
  {
    id: 'guild_home',
    name: 'Home Warriors (Домашні Воїни)',
    description: 'Тренування вдома, без дорогих абонементів. Турнік у дверях, гантелі, гирі, резинки та незламний характер.',
    motto: 'Будь-яка кімната — це тренувальний плацдарм!',
    icon: '🏠',
    disciplineFocus: 'hybrid',
    membersCount: 215,
    totalXp: 34100,
    level: 5,
    leaderName: 'Home Fitness Lead',
    activeChallenge: 'Щоденна планка 5 хв x 7 днів',
    isJoinedByMe: false
  },
  {
    id: 'guild_beginners',
    name: 'Beginner Forge (Перша Кузня)',
    description: 'Тепле співтовариство для початківців. Вчимо базу, ставимо техніку дихання, розбираємо помилки без токсичності.',
    motto: 'Кожен чемпіон колись починав з нуля.',
    icon: '🌱',
    disciplineFocus: 'hybrid',
    membersCount: 460,
    totalXp: 28700,
    level: 4,
    leaderName: 'Beginner Mentor',
    activeChallenge: '100% відвідування 3 тренувань за тиждень',
    isJoinedByMe: false
  }
];

const SEED_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'dq_1',
    title: 'Залізний гарт',
    description: 'Завершити 1 повноцінну тренувальну сесію через Камеру-трекер або журнал',
    category: 'workout',
    progress: 1,
    target: 1,
    unit: 'сесія',
    xpReward: 100,
    isCompleted: true,
    isClaimed: false
  },
  {
    id: 'dq_2',
    title: 'Сотня повторень',
    description: 'Виконати сумарно 50 чистих повторень будь-якої вправи',
    category: 'reps',
    progress: 32,
    target: 50,
    unit: 'репів',
    xpReward: 120,
    isCompleted: false,
    isClaimed: false
  },
  {
    id: 'dq_3',
    title: 'Спрага до знань',
    description: 'Прочитати 1 статтю в базі Forge Wiki або пройти тест Myth or Fact',
    category: 'knowledge',
    progress: 0,
    target: 1,
    unit: 'матеріал',
    xpReward: 60,
    isCompleted: false,
    isClaimed: false
  },
  {
    id: 'dq_4',
    title: 'Братерство Кузні',
    description: 'Поставити оцінку корисності або написати коментар/відповідь у Community',
    category: 'community',
    progress: 1,
    target: 1,
    unit: 'дія',
    xpReward: 50,
    isCompleted: true,
    isClaimed: true
  }
];

const SEED_WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'wc_1',
    title: 'Столітній Рубіж Підтягувань',
    description: 'Виконати сумарно 100 чистих підтягувань протягом 7 днів',
    category: 'strength',
    progress: 68,
    target: 100,
    unit: 'підтягувань',
    xpReward: 400,
    badgeReward: '🦅 Володар Перекладини',
    daysRemaining: 3,
    isCompleted: false,
    isClaimed: false
  },
  {
    id: 'wc_2',
    title: 'Залізна Регулярність',
    description: 'Провести мінімум 4 тренування у різні дні тижня без пропусків',
    category: 'consistency',
    progress: 3,
    target: 4,
    unit: 'дні',
    xpReward: 350,
    badgeReward: '⏱️ Хранитель Дисципліни',
    daysRemaining: 4,
    isCompleted: false,
    isClaimed: false
  },
  {
    id: 'wc_3',
    title: 'Експертний Ментор',
    description: 'Дати корисну відповідь у «Ask the Forge» та отримати 5+ upvotes',
    category: 'education',
    progress: 1,
    target: 1,
    unit: 'відповідь',
    xpReward: 300,
    badgeReward: '🧠 Мудрець Ковадла',
    daysRemaining: 5,
    isCompleted: true,
    isClaimed: false
  }
];

const RANDOM_CHALLENGES_POOL: RandomChallenge[] = [
  {
    id: 'rc_1',
    title: 'Вибухова двадцятка віджимань',
    description: 'Зробити 20 віджимань з відривом долонь від підлоги або плесканням',
    rarity: 'common',
    targetReps: 20,
    exerciseName: 'Віджимання від підлоги',
    timeLimitMinutes: 3,
    xpReward: 70
  },
  {
    id: 'rc_2',
    title: 'Алмазний штурм',
    description: 'Виконати 15 вузьких алмазних віджимань з фіксацією внизу на 1 секунду',
    rarity: 'rare',
    targetReps: 15,
    exerciseName: 'Алмазні віджимання',
    timeLimitMinutes: 3,
    xpReward: 140
  },
  {
    id: 'rc_3',
    title: 'Швейцарський годинник на брусах',
    description: '25 чистих віджимань на брусах з контрольованим темпом 3-0-1 (3 сек опускання)',
    rarity: 'epic',
    targetReps: 25,
    exerciseName: 'Віджимання на паралельних брусах',
    timeLimitMinutes: 4,
    xpReward: 250
  },
  {
    id: 'rc_4',
    title: 'Титан Перекладини (Muscle-Up Protocol)',
    description: '8 чистих виходів силою на дві руки без торкання ногами землі',
    rarity: 'legendary',
    targetReps: 8,
    exerciseName: 'Вихід силою на дві руки',
    timeLimitMinutes: 5,
    xpReward: 500
  },
  {
    id: 'rc_5',
    title: 'Сталевий кор (L-Sit Hold)',
    description: 'Утримання куточка L-sit на підлозі чи брусах сумарно 60 секунд',
    rarity: 'rare',
    targetReps: 60,
    exerciseName: 'Утримання куточка L-Sit',
    timeLimitMinutes: 3,
    xpReward: 160
  }
];

const SEED_MYTH_FACTS: MythFactItem[] = [
  {
    id: 'mf_1',
    statement: 'Крепатура наступного дня (DOMS) викликається накопиченням молочної кислоти (лактату) у мʼязах.',
    isMyth: true,
    shortFact: 'МІФ! Лактат нейтралізується та виводиться організмом протягом 60 хвилин після закінчення навантаження.',
    scientificExplanation: 'Крепатура виникає через мікроскопічні пошкодження саркомерів міофібрил (особливо під час ексцентричної фази руху) та подальшу локальну запальну реакцію з набряком і подразненням больових рецепторів.',
    source: 'Journal of Applied Physiology & ACSM Guidelines',
    category: 'recovery'
  },
  {
    id: 'mf_2',
    statement: 'Зведення та опускання лопаток у жимі лежачи захищає плечовий суглоб від травми ротаторної манжети.',
    isMyth: false,
    shortFact: 'ФАКТ! Ретракція та депресія лопаток створюють стабільний фундамент і розширюють субакроміальний простір.',
    scientificExplanation: 'Коли лопатки зафіксовані назад і вниз, головка плечової кістки не защемлює сухожилля надостного мʼяза під час проходження критичної точки амплітуди.',
    source: 'Biomechanics of Resistance Exercise, Dr. Brad Schoenfeld',
    category: 'anatomy'
  },
  {
    id: 'mf_3',
    statement: 'Анаболічне білкове вікно вимагає негайного прийому протеїну протягом 30 хвилин після тренування, інакше мʼязи згорять.',
    isMyth: true,
    shortFact: 'МІФ! Підвищений синтез мʼязового білка (MPS) зберігається від 24 до 48 годин після якісного силового тренування.',
    scientificExplanation: 'Ключовим фактором гіпертрофії є загальна добова кількість якісного білка (1.6 - 2.2 г/кг) та його рівномірний розподіл кожні 3-5 годин, а не лічені хвилини після заняття.',
    source: 'International Society of Sports Nutrition (ISSN) Position Stand',
    category: 'nutrition'
  },
  {
    id: 'mf_4',
    statement: 'Креатин моногідрат затримує воду всередині мʼязових клітин (внутрішньоклітинна гідратація), покращуючи анаболічні сигнали.',
    isMyth: false,
    shortFact: 'ФАКТ! Креатин діє як клітинний осмоліт, збільшуючи обʼєм міоцитів та прискорюючи ресинтез АТФ.',
    scientificExplanation: 'Внутрішньоклітинна гідратація стимулює клітинне набухання (cell swelling), що активує сигнальний шлях mTORC1 та знижує розпад білка під час навантажень.',
    source: 'Medicine & Science in Sports & Exercise',
    category: 'nutrition'
  },
  {
    id: 'mf_5',
    statement: 'Качанням пресу по 100 разів щодня можна спалити жир безпосередньо в зоні живота (локальне жироспалення).',
    isMyth: true,
    shortFact: 'МІФ! Локального спалювання підшкірного жиру не існує — ліполіз відбувається системно по всьому тілу.',
    scientificExplanation: 'Вправи на мʼязи живота зміцнюють прямий і косі мʼязи, проте мобілізація тригліцеридів із жирових клітин регулюється гормонами (адреналіном, норадреналіном) через загальний дефіцит енергії.',
    source: 'American Council on Exercise (ACE) Clinical Studies',
    category: 'training'
  },
  {
    id: 'mf_6',
    statement: 'Підтягування за голову збільшують ризик імпінджмент-синдрому плеча у порівнянні з підтягуваннями до грудей.',
    isMyth: false,
    shortFact: 'ФАКТ! Рух за голову вимагає крайньої зовнішньої ротації та горизонтального відведення плеча.',
    scientificExplanation: 'У більшості людей анатомія акроміального відростка та недостатня мобільність грудного відділу призводять до компресії нервово-судинного пучка та сухожиль.',
    source: 'National Strength and Conditioning Association (NSCA)',
    category: 'training'
  }
];

const SEED_WIKI_ARTICLES: WikiArticle[] = [
  {
    id: 'wiki_1',
    title: 'Біомеханіка виходу силою на дві руки: повний технічний розбір',
    section: 'exercises',
    summary: 'Кінематика траєкторії, таймінг маху (кіпінг vs строгий стиль), техніка транзиції кистей та запобігання травмам ліктів.',
    content: `## 1. Фази руху
Вихід силою складається з чотирьох послідовних біомеханічних фаз:
1. **Початковий заряд:** Контрольований вихід вперед у натяжку (hollow body), де грудний відділ відкритий.
2. **Вибухова вертикальна тяга:** Активний рух назад і вгору. Тягнути треба не вертикально під турнік, а по дузі навколо перекладини до лінії сосків або ребер.
3. **Транзиція (перекат кистей):** Найважливіший момент. Плечі викидаються вперед над турніком, а кисті швидко провертаються з нижнього хвата у верхній опорний хват (False Grip або швидкий перекат).
4. **Вижимання з перекладини:** Класичне глибоке віджимання від турніка з фіксацією у верхній точці.

## 2. Головні помилки
- **Вихід через одну руку («куряче крило»):** Перевантажує сухожилля біцепса та медіальний надвиросток ліктя. Категорично заборонено!
- **Падіння на турнік грудьми:** Свідчить про недостатню висоту тяги. Потрібно підтягуватися вище.`,
    authorName: 'Forge Academy',
    readTimeMinutes: 4,
    tags: ['калістеніка', 'вихід на дві', 'турнік', 'біомеханіка'],
    views: 1240,
    isReadByMe: true
  },
  {
    id: 'wiki_2',
    title: 'Протокол прогресивного перевантаження в натуральному бодибілдингу',
    section: 'training',
    summary: 'Як збільшувати стимул для росту без виснаження ЦНС: вага, повторення, діапазон RPE/RIR та щільність тренування.',
    content: `## Що таке прогресивне перевантаження?
Мʼязова тканина адаптується до стресу лише тоді, коли стимул перевищує попередній звичний рівень. Але прогрес — це не тільки накидання млинців на штангу.

### 5 векторів перевантаження:
1. **Збільшення робочої ваги** при збереженні точної амплітуди (+1-2.5 кг).
2. **Збільшення кількості повторень** у підході з тією ж вагою (наприклад, з 8 до 10 репів).
3. **Збільшення кількості робочих підходів** (тижневий обсяг від 10 до 20 сетів на групу).
4. **Покращення контролю темпу** (збільшення ексцентричної фази до 3 секунд).
5. **Скорочення часу відпочинку** між підходами при збереженні продуктивності (підвищення щільності).

### Поняття RIR (Reps in Reserve):
Більшість робочих підходів натурального атлета має завершуватися на рівні 1-2 RIR (1-2 повторення до повного відмови). Постійна відмова перевантажує нервову систему.`,
    authorName: 'Forge Academy',
    readTimeMinutes: 5,
    tags: ['бодибілдинг', 'прогресія', 'RPE', 'обсяг'],
    views: 980,
    isReadByMe: false
  },
  {
    id: 'wiki_3',
    title: 'Гідратація та електроліти: чому нестача води руйнує силові показники',
    section: 'nutrition',
    summary: 'Розрахунок потреби у воді для силовиків, баланс калію й натрію, вплив зневоднення на фасцію та мʼязовий спазм.',
    content: `## Вплив зневоднення на силові
Втрата рідини всього на 2% від маси тіла знижує максимальну потужність мʼязового скорочення на 10-15%, а витривалість — до 30%.

### Базовий норматив:
- **Базова норма:** 35-40 мл чистої води на кожен кілограм ваги тіла.
- **Тренувальний бонус:** +500-800 мл на кожну годину інтенсивного потовиділення.
- **Електроліти:** Натрій (сіль) та калій забезпечують роботу натрій-калієвого насоса клітинних мембран, без якого нервовий імпульс не передається мʼязовому волокну. Додавайте дрібку якісної морської солі у воду під час важких літніх тренувань.`,
    authorName: 'Forge Academy',
    readTimeMinutes: 3,
    tags: ['вода', 'гідратація', 'електроліти', 'здоровʼя'],
    views: 810,
    isReadByMe: false
  }
];

class CommunityStore {
  private posts: CommunityPost[] = [];
  private questions: AskQuestion[] = [];
  private guilds: Guild[] = [];
  private dailyQuests: DailyQuest[] = [];
  private weeklyChallenges: WeeklyChallenge[] = [];
  private mythFacts: MythFactItem[] = [];
  private wikiArticles: WikiArticle[] = [];
  private userProfile: UserProfile;
  private reports: ModerationReport[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.userProfile = this.loadUserProfile();
    this.loadData();
    authStore.subscribe(() => {
      this.notify();
    });
  }

  private loadUserProfile(): UserProfile {
    try {
      const saved = localStorage.getItem('forgemuscle_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 'me',
      username: 'Сталевий_Атлет',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces',
      level: 4,
      reputationPoints: 260,
      reputationRank: 'Helper',
      streakDays: 6,
      discipline: 'hybrid',
      guildId: 'guild_cali',
      guildName: 'Calisthenics Elite',
      completedChallengesCount: 14,
      bio: 'Шліфую чисту техніку виходів силою та важких жимів. Кузня ForgeMuscle — мій щоденний ритуал!',
      joinedDate: 'Вересень 2024',
      blockedUserIds: []
    };
  }

  private loadData() {
    try {
      const p = localStorage.getItem('forgemuscle_community_posts');
      this.posts = p ? JSON.parse(p) : SEED_POSTS;

      const q = localStorage.getItem('forgemuscle_ask_questions');
      this.questions = q ? JSON.parse(q) : SEED_QUESTIONS;

      const g = localStorage.getItem('forgemuscle_guilds');
      this.guilds = g ? JSON.parse(g) : SEED_GUILDS;

      const dq = localStorage.getItem('forgemuscle_daily_quests');
      this.dailyQuests = dq ? JSON.parse(dq) : SEED_DAILY_QUESTS;

      const wc = localStorage.getItem('forgemuscle_weekly_challenges');
      this.weeklyChallenges = wc ? JSON.parse(wc) : SEED_WEEKLY_CHALLENGES;

      const mf = localStorage.getItem('forgemuscle_myth_facts');
      this.mythFacts = mf ? JSON.parse(mf) : SEED_MYTH_FACTS;

      const w = localStorage.getItem('forgemuscle_wiki_articles');
      this.wikiArticles = w ? JSON.parse(w) : SEED_WIKI_ARTICLES;

      const r = localStorage.getItem('forgemuscle_moderation_reports');
      this.reports = r ? JSON.parse(r) : [];
    } catch {
      this.posts = SEED_POSTS;
      this.questions = SEED_QUESTIONS;
      this.guilds = SEED_GUILDS;
      this.dailyQuests = SEED_DAILY_QUESTS;
      this.weeklyChallenges = SEED_WEEKLY_CHALLENGES;
      this.mythFacts = SEED_MYTH_FACTS;
      this.wikiArticles = SEED_WIKI_ARTICLES;
      this.reports = [];
    }
  }

  private save() {
    try {
      localStorage.setItem('forgemuscle_user_profile', JSON.stringify(this.userProfile));
      localStorage.setItem('forgemuscle_community_posts', JSON.stringify(this.posts));
      localStorage.setItem('forgemuscle_ask_questions', JSON.stringify(this.questions));
      localStorage.setItem('forgemuscle_guilds', JSON.stringify(this.guilds));
      localStorage.setItem('forgemuscle_daily_quests', JSON.stringify(this.dailyQuests));
      localStorage.setItem('forgemuscle_weekly_challenges', JSON.stringify(this.weeklyChallenges));
      localStorage.setItem('forgemuscle_myth_facts', JSON.stringify(this.mythFacts));
      localStorage.setItem('forgemuscle_wiki_articles', JSON.stringify(this.wikiArticles));
      localStorage.setItem('forgemuscle_moderation_reports', JSON.stringify(this.reports));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // ==================== GETTERS ====================

  public getUserProfile(): UserProfile {
    const authUser = authStore.getCurrentUser();
    if (authUser) {
      return {
        ...this.userProfile,
        id: authUser.id,
        username: authUser.username,
        avatar: authUser.avatar,
        level: authUser.level,
        streakDays: authUser.streak,
        discipline: authUser.discipline,
        bio: authUser.bio || this.userProfile.bio,
        isPremium: authUser.isPremium,
        isCreator: authUser.role === 'CREATOR' || authUser.role === 'VERIFIED_CREATOR',
        guildId: authUser.guildId || this.userProfile.guildId,
        guildName: authUser.guildName || this.userProfile.guildName
      };
    }
    return { ...this.userProfile };
  }

  public getPosts(): CommunityPost[] {
    const blocked = new Set(this.userProfile.blockedUserIds || []);
    return this.posts.filter((p) => !blocked.has(p.authorId));
  }

  public getQuestions(): AskQuestion[] {
    const blocked = new Set(this.userProfile.blockedUserIds || []);
    return this.questions.filter((q) => !blocked.has(q.authorId));
  }

  public getGuilds(): Guild[] {
    return [...this.guilds];
  }

  public getDailyQuests(): DailyQuest[] {
    return [...this.dailyQuests];
  }

  public getWeeklyChallenges(): WeeklyChallenge[] {
    return [...this.weeklyChallenges];
  }

  public getMythFacts(): MythFactItem[] {
    return [...this.mythFacts];
  }

  public getWikiArticles(): WikiArticle[] {
    return [...this.wikiArticles];
  }

  public getForgeScore(): ForgeScoreBreakdown {
    // Dynamic calculate athletic Forge Score (0 - 1000)
    const training = Math.min(250, Math.round(this.userProfile.level * 35 + this.userProfile.completedChallengesCount * 8));
    const consistency = Math.min(200, Math.round(this.userProfile.streakDays * 22 + 40));
    const challenges = Math.min(200, Math.round(this.userProfile.completedChallengesCount * 14));
    const knowledge = Math.min(150, Math.round(this.wikiArticles.filter(w => w.isReadByMe).length * 40 + 30));
    const community = Math.min(200, Math.round(this.userProfile.reputationPoints * 0.45));
    const total = training + consistency + challenges + knowledge + community;
    return { training, consistency, challenges, knowledge, community, total };
  }

  // ==================== COMMUNITY ACTIONS ====================

  public addPost(post: Omit<CommunityPost, 'id' | 'createdAt' | 'upvotes' | 'commentsCount' | 'comments' | 'authorId' | 'authorName' | 'authorAvatar' | 'authorRank'>) {
    const newPost: CommunityPost = {
      ...post,
      id: `post_${Date.now()}`,
      authorId: this.userProfile.id,
      authorName: this.userProfile.username,
      authorAvatar: this.userProfile.avatar,
      authorRank: this.userProfile.reputationRank,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      isUpvotedByMe: true,
      commentsCount: 0,
      comments: []
    };

    this.posts.unshift(newPost);
    this.addReputationPoints(15, 'Створення корисної публікації');
    this.save();
    sound.playLevelUp();
    return newPost;
  }

  public deletePost(postId: string) {
    this.posts = this.posts.filter((p) => p.id !== postId);
    this.save();
    sound.playClick();
  }

  public togglePostUpvote(postId: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.isUpvotedByMe) {
      post.upvotes = Math.max(0, post.upvotes - 1);
      post.isUpvotedByMe = false;
    } else {
      post.upvotes += 1;
      post.isUpvotedByMe = true;
      sound.playClick();
    }
    this.save();
  }

  public addComment(postId: string, content: string) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    const newComment: PostComment = {
      id: `comm_${Date.now()}`,
      postId,
      authorId: this.userProfile.id,
      authorName: this.userProfile.username,
      authorAvatar: this.userProfile.avatar,
      authorRank: this.userProfile.reputationRank,
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      isUpvotedByMe: false
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    post.commentsCount = post.comments.length;

    this.addReputationPoints(5, 'Коментар до обговорення');
    this.save();
    sound.playClick();
  }

  // ==================== ASK THE FORGE (Q&A) ====================

  public addQuestion(title: string, details: string, category: CommunityPost['category'], tags: string[]) {
    const newQuestion: AskQuestion = {
      id: `q_${Date.now()}`,
      title,
      details,
      category,
      tags,
      authorId: this.userProfile.id,
      authorName: this.userProfile.username,
      authorAvatar: this.userProfile.avatar,
      authorRank: this.userProfile.reputationRank,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      isUpvotedByMe: true,
      answersCount: 0,
      answers: [],
      isResolved: false,
      reputationBounty: 50
    };

    this.questions.unshift(newQuestion);
    this.addReputationPoints(10, 'Нове запитання в Кузні');
    this.save();
    sound.playLevelUp();
    return newQuestion;
  }

  public addAnswer(questionId: string, content: string) {
    const q = this.questions.find((item) => item.id === questionId);
    if (!q) return;

    const newAnswer: QuestionAnswer = {
      id: `ans_${Date.now()}`,
      questionId,
      authorId: this.userProfile.id,
      authorName: this.userProfile.username,
      authorAvatar: this.userProfile.avatar,
      authorRank: this.userProfile.reputationRank,
      content,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      isUpvotedByMe: false,
      isBestAnswer: false
    };

    q.answers.push(newAnswer);
    q.answersCount = q.answers.length;

    this.addReputationPoints(15, 'Відповідь на запитання');
    this.save();
    sound.playAnvilHit();
  }

  public markBestAnswer(questionId: string, answerId: string) {
    const q = this.questions.find((item) => item.id === questionId);
    if (!q) return;

    q.answers.forEach((ans) => {
      ans.isBestAnswer = ans.id === answerId;
    });
    q.bestAnswerId = answerId;
    q.isResolved = true;

    // Award extra reputation to the author of best answer if it's user or simulate reward
    this.addReputationPoints(50, 'Отримання відзнаки Best Answer');
    this.save();
    sound.playTrophy();
  }

  public toggleAnswerUpvote(questionId: string, answerId: string) {
    const q = this.questions.find((item) => item.id === questionId);
    if (!q) return;
    const ans = q.answers.find((a) => a.id === answerId);
    if (!ans) return;

    if (ans.isUpvotedByMe) {
      ans.upvotes = Math.max(0, ans.upvotes - 1);
      ans.isUpvotedByMe = false;
    } else {
      ans.upvotes += 1;
      ans.isUpvotedByMe = true;
      sound.playClick();
    }
    this.save();
  }

  // ==================== GUILDS ====================

  public joinGuild(guildId: string) {
    this.guilds.forEach((g) => {
      if (g.id === guildId) {
        g.isJoinedByMe = true;
        g.membersCount += 1;
        this.userProfile.guildId = g.id;
        this.userProfile.guildName = g.name;
      } else if (g.isJoinedByMe) {
        g.isJoinedByMe = false;
        g.membersCount = Math.max(1, g.membersCount - 1);
      }
    });
    sound.playTrophy();
    this.save();
  }

  public leaveGuild(guildId: string) {
    const g = this.guilds.find((item) => item.id === guildId);
    if (g && g.isJoinedByMe) {
      g.isJoinedByMe = false;
      g.membersCount = Math.max(1, g.membersCount - 1);
      this.userProfile.guildId = undefined;
      this.userProfile.guildName = undefined;
      sound.playClick();
      this.save();
    }
  }

  // ==================== QUESTS & CHALLENGES ====================

  public claimDailyQuest(questId: string): number {
    const q = this.dailyQuests.find((item) => item.id === questId);
    if (!q || !q.isCompleted || q.isClaimed) return 0;

    q.isClaimed = true;
    this.userProfile.completedChallengesCount += 1;
    this.addReputationPoints(25, 'Виконання щоденного квесту');
    sound.playLevelUp();
    this.save();
    return q.xpReward;
  }

  public claimWeeklyChallenge(challengeId: string): number {
    const c = this.weeklyChallenges.find((item) => item.id === challengeId);
    if (!c || !c.isCompleted || c.isClaimed) return 0;

    c.isClaimed = true;
    this.userProfile.completedChallengesCount += 1;
    this.addReputationPoints(80, 'Виконання щотижневого челенджу');
    sound.playTrophy();
    this.save();
    return c.xpReward;
  }

  public getRandomChallenge(): RandomChallenge {
    const randomIndex = Math.floor(Math.random() * RANDOM_CHALLENGES_POOL.length);
    return RANDOM_CHALLENGES_POOL[randomIndex];
  }

  // ==================== WIKI & MYTH FACT ====================

  public markWikiArticleRead(articleId: string) {
    const a = this.wikiArticles.find((item) => item.id === articleId);
    if (a && !a.isReadByMe) {
      a.isReadByMe = true;
      a.views += 1;
      this.addReputationPoints(10, 'Вивчення матеріалу Forge Wiki');
      this.save();
    }
  }

  public addWikiArticle(title: string, section: WikiArticle['section'], summary: string, content: string, tags: string[]) {
    const newArticle: WikiArticle = {
      id: `wiki_${Date.now()}`,
      title,
      section,
      summary,
      content,
      authorName: this.userProfile.username,
      readTimeMinutes: Math.max(2, Math.round(content.length / 450)),
      tags,
      views: 1,
      isReadByMe: true
    };
    this.wikiArticles.unshift(newArticle);
    this.addReputationPoints(40, 'Публікація статті у Forge Wiki');
    this.save();
    sound.playTrophy();
    return newArticle;
  }

  // ==================== REPUTATION & PROFILE ====================

  public addReputationPoints(points: number, reason: string) {
    this.userProfile.reputationPoints += points;
    const newRank = getReputationRank(this.userProfile.reputationPoints);
    if (newRank !== this.userProfile.reputationRank) {
      this.userProfile.reputationRank = newRank;
      sound.playTrophy();
    }
    this.save();
  }

  public updateProfile(updates: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...updates };
    this.save();
    sound.playClick();
  }

  // ==================== MODERATION ====================

  public reportContent(targetId: string, targetType: ModerationReport['targetType'], reason: ModerationReport['reason'], details?: string) {
    const report: ModerationReport = {
      id: `rep_${Date.now()}`,
      targetId,
      targetType,
      reason,
      details,
      createdAt: new Date().toISOString()
    };
    this.reports.push(report);

    // If it's a post, mark as reported
    const post = this.posts.find((p) => p.id === targetId);
    if (post) post.isReported = true;

    this.save();
    sound.playClick();
  }

  public blockUser(userId: string, userName: string) {
    if (!this.userProfile.blockedUserIds.includes(userId)) {
      this.userProfile.blockedUserIds.push(userId);
      this.save();
      sound.playClick();
    }
  }

  public unblockUser(userId: string) {
    this.userProfile.blockedUserIds = this.userProfile.blockedUserIds.filter((id) => id !== userId);
    this.save();
    sound.playClick();
  }
}

export const communityStore = new CommunityStore();
