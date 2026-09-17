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
import { arnoVoice } from './arnoVoice';

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

const SEED_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    title: 'Мій шлях від 0 до 12 чистих виходів силою на дві руки (Детальний гайд)',
    content: 'Вихід силою — це не просто сила підтягувань, це насамперед вибуховий потяг до грудей і швидкий перехід кистей (фаза транзиції). Основні помилки: тягнути по черзі через одну руку (це ламає ліктьові суглоби) та відсутність хитання ніг на початку. Тренуйте високі вибухові підтягування до пояса на низькому турніку з гумою, плюс глибокі віджимання від перекладини на рівні паху.',
    category: 'calisthenics',
    type: 'guide',
    tags: ['калістеніка', 'вихід силі', 'турнік', 'техніка'],
    authorId: 'user_taras',
    authorName: 'Тарас «Залізо»',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    authorRank: 'Mentor',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    upvotes: 42,
    isUpvotedByMe: false,
    commentsCount: 3,
    isPinned: true,
    comments: [
      {
        id: 'comm_1',
        postId: 'post_1',
        authorId: 'user_oleg',
        authorName: 'Олег Стриж',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Fighter',
        content: 'Повністю згоден щодо вибухових підтягувань! Сам додав роботу з гумою і за місяць додав +3 повторення без розгойдування.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        upvotes: 7
      },
      {
        id: 'comm_2',
        postId: 'post_1',
        authorId: 'user_vitalik',
        authorName: 'Віталій В.',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Helper',
        content: 'А яку гуму порадиш для початку при вазі 80 кг?',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        upvotes: 2
      }
    ]
  },
  {
    id: 'post_2',
    title: 'Чому ваші грудні не ростуть у жимі лежачи: зміщення акценту на трицепс і плечі',
    content: 'Найчастіша проблема новачків у класичному жимі штанги лежачи — пласкі лопатки та надто широкий або вузький хват. Якщо лопатки не зведені й не опущені до таза (депресія лопаток), передня дельта бере на себе до 60% стартового зусилля. Обовʼязково робіть міст (арку), розпирайте підлогу ногами (leg drive) і торкайтеся штангою лінії низу грудей, а не шиї.',
    category: 'bodybuilding',
    type: 'advice',
    tags: ['бодибілдинг', 'жим лежачи', 'груди', 'паверліфтинг'],
    authorId: 'user_maks',
    authorName: 'Максим «Титановий»',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
    authorRank: 'Master',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    upvotes: 35,
    isUpvotedByMe: false,
    commentsCount: 1,
    comments: [
      {
        id: 'comm_3',
        postId: 'post_2',
        authorId: 'user_andriy',
        authorName: 'Андрій К.',
        authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Helper',
        content: 'Дуже цінно, спробував опустити лопатки — біль у передній дельті одразу зник!',
        createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        upvotes: 5
      }
    ]
  },
  {
    id: 'post_3',
    title: 'Харчовий таймінг: що реально працює перед і після тренування',
    content: 'Забудьте про міф про 30-хвилинне закриття анаболічного вікна. Реальний період підвищеної чутливості до поживних речовин триває до 24-48 годин. Найголовніше: 1) Легкі повільні вуглеводи за 90-120 хв до тренування (вівсянка/банан); 2) 0.4-0.5 г білка на кг ваги протягом 2 годин після завершення; 3) Гідратація — мінус 2% води зменшує силу на 15%.',
    category: 'nutrition',
    type: 'experience',
    tags: ['харчування', 'білок', 'гідратація', 'відновлення'],
    authorId: 'user_daria',
    authorName: 'Дарина Нутрієнт',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    authorRank: 'Mentor',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    upvotes: 28,
    isUpvotedByMe: false,
    commentsCount: 0
  }
];

const SEED_QUESTIONS: AskQuestion[] = [
  {
    id: 'q_1',
    title: 'Як уникнути болю в ліктях (епікондиліту) при частих підтягуваннях прямим хватом?',
    details: 'Тренуюся 4 рази на тиждень, роблю багато підтягувань вузьким та широким хватом. Останні 2 тижні ниє зовнішня сторона ліктя. Що змінити в програмі та як відновитися без повної зупинки?',
    category: 'calisthenics',
    tags: ['лікті', 'підтягування', 'травми', 'відновлення'],
    authorId: 'user_artur',
    authorName: 'Артур_Новак',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
    authorRank: 'Helper',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    upvotes: 19,
    isUpvotedByMe: false,
    answersCount: 2,
    isResolved: true,
    bestAnswerId: 'ans_1',
    reputationBounty: 50,
    answers: [
      {
        id: 'ans_1',
        questionId: 'q_1',
        authorId: 'user_taras',
        authorName: 'Тарас «Залізо»',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Mentor',
        content: '1. Тимчасово перейди на паралельний хват (нейтральний) або гімнастичні кільця — вони дозволяють кисті природно обертатися й розвантажують зв’язки ліктя. 2. Додай ексцентричні вправи на розгиначі пальців та передпліччя з гумкою. 3. Жодного локауту ліктя в нижній точці під час болю. 4. Масаж тригерних точок передпліччя тенісним м’ячем.',
        createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
        upvotes: 14,
        isUpvotedByMe: false,
        isBestAnswer: true
      },
      {
        id: 'ans_2',
        questionId: 'q_1',
        authorId: 'user_oleg',
        authorName: 'Олег Стриж',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Fighter',
        content: 'Також зменш обсяг на 40% на 10 днів. Мені допомогла магнезія і відмова від дуже тонких слизьких турніків.',
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        upvotes: 4,
        isUpvotedByMe: false,
        isBestAnswer: false
      }
    ]
  },
  {
    id: 'q_2',
    title: 'Чи є сенс новачку вживати креатин моногідрат у перші 3 місяці тренувань?',
    details: 'Почав тренуватися місяць тому (бодибілдинг). В залі радять одразу пити креатин. Чи дасть це ефект, чи краще спочатку налагодити техніку та звичайний раціон?',
    category: 'nutrition',
    tags: ['креатин', 'добавки', 'новачки'],
    authorId: 'user_dmytro',
    authorName: 'Дмитро К.',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=faces',
    authorRank: 'Newcomer',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    upvotes: 11,
    isUpvotedByMe: false,
    answersCount: 1,
    isResolved: false,
    answers: [
      {
        id: 'ans_3',
        questionId: 'q_2',
        authorId: 'user_maks',
        authorName: 'Максим «Титановий»',
        authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
        authorRank: 'Master',
        content: 'Креатин — абсолютно безпечна і робоча добавка, але в перші 3 місяці твої м’язи й так ростимуть шаленими темпами завдяки нейром’язовій адаптації. Сфокусуйся на стабільних 1.6-2.0 г білка на кг ваги та правильній траєкторії руху. Креатин підключиш через півроку, коли настане перше плато!',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        upvotes: 8,
        isUpvotedByMe: false,
        isBestAnswer: false
      }
    ]
  }
];

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
    leaderName: 'Максим «Титановий»',
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
    leaderName: 'Тарас «Залізо»',
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
    leaderName: 'Олег Стриж',
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
    leaderName: 'Дарина Нутрієнт',
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
    authorName: 'Тарас «Залізо»',
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
    authorName: 'Максим «Титановий»',
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
    authorName: 'Дарина Нутрієнт',
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
    arnoVoice.speak(`Чудовий допис! Твій внесок у спільноту приніс плюс п'ятнадцять очок репутації.`);
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
    arnoVoice.speak(`Запитання опубліковано! Наставники Кузні скоро дадуть відповідь.`);
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
    arnoVoice.speak(`Дякую за відповідь! Допомога побратимам гартує авторитет.`);
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
    arnoVoice.speak(`Чудово! Найкращу відповідь відзначено зіркою Кузні та бонусом репутації!`);
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
        arnoVoice.speak(`Вітаю у гільдії ${g.name}! Твій молот тепер служить спільній перемозі.`);
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
    arnoVoice.speak(`Неймовірно! Щотижневий виклик підкорено. Твоя нагорода зарахована!`);
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
    arnoVoice.speak(`Статтю додано до загальної бази знань! Твій внесок оцінять сотні атлетів.`);
    return newArticle;
  }

  // ==================== REPUTATION & PROFILE ====================

  public addReputationPoints(points: number, reason: string) {
    this.userProfile.reputationPoints += points;
    const newRank = getReputationRank(this.userProfile.reputationPoints);
    if (newRank !== this.userProfile.reputationRank) {
      this.userProfile.reputationRank = newRank;
      sound.playTrophy();
      arnoVoice.speak(`Вітаю! Твій ранг репутації підвищено до «${newRank}»!`);
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
    arnoVoice.speak(`Скаргу прийнято. Модератори Кузні перевірять відповідність правилам.`);
  }

  public blockUser(userId: string, userName: string) {
    if (!this.userProfile.blockedUserIds.includes(userId)) {
      this.userProfile.blockedUserIds.push(userId);
      this.save();
      sound.playClick();
      arnoVoice.speak(`Користувача ${userName} заблоковано. Його дописи приховані з твоєї стрічки.`);
    }
  }

  public unblockUser(userId: string) {
    this.userProfile.blockedUserIds = this.userProfile.blockedUserIds.filter((id) => id !== userId);
    this.save();
    sound.playClick();
  }
}

export const communityStore = new CommunityStore();
