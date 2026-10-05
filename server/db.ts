import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'forgemuscle.sqlite');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    runMigrations(dbInstance);
  }
  return dbInstance;
}

function runMigrations(db: DatabaseSync) {
  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nick TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      avatar TEXT NOT NULL DEFAULT '⚡',
      password_hash TEXT,
      password_salt TEXT,
      locale TEXT NOT NULL DEFAULT 'uk',
      unit_system TEXT NOT NULL DEFAULT 'metric',
      theme TEXT NOT NULL DEFAULT 'dark',
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      haptic_enabled INTEGER NOT NULL DEFAULT 1,
      privacy TEXT NOT NULL DEFAULT 'public',
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      mic_enabled INTEGER NOT NULL DEFAULT 1,
      camera_enabled INTEGER NOT NULL DEFAULT 1,
      push_to_talk INTEGER NOT NULL DEFAULT 0,
      show_skeleton INTEGER NOT NULL DEFAULT 1,
      mirror_video INTEGER NOT NULL DEFAULT 1,
      is_guest INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_info TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT PRIMARY KEY,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      streak_days INTEGER NOT NULL DEFAULT 1,
      coins INTEGER NOT NULL DEFAULT 250,
      last_active_date TEXT NOT NULL,
      active_title_id TEXT NOT NULL DEFAULT 'novice',
      total_wins INTEGER NOT NULL DEFAULT 0,
      total_losses INTEGER NOT NULL DEFAULT 0,
      total_reps INTEGER NOT NULL DEFAULT 0,
      exercise_reps_json TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description TEXT NOT NULL,
      description_en TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      icon TEXT NOT NULL,
      preview_color TEXT,
      effect_type TEXT,
      effect_value TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      purchased_at INTEGER NOT NULL,
      equipped INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reference_id TEXT,
      description TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description TEXT NOT NULL,
      description_en TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL,
      xp_reward INTEGER NOT NULL,
      coins_reward INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      reward_claimed INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS user_titles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title_id TEXT NOT NULL,
      unlocked_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, title_id)
    );

    CREATE TABLE IF NOT EXISTS user_quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_id TEXT NOT NULL,
      quest_type TEXT NOT NULL,
      current_val INTEGER NOT NULL DEFAULT 0,
      goal_val INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      claimed INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, quest_id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      player1_id TEXT NOT NULL,
      player2_id TEXT,
      player1_reps INTEGER NOT NULL DEFAULT 0,
      player2_reps INTEGER NOT NULL DEFAULT 0,
      player1_accuracy REAL NOT NULL DEFAULT 100,
      player2_accuracy REAL NOT NULL DEFAULT 100,
      winner_id TEXT,
      nonce TEXT NOT NULL UNIQUE,
      duration_seconds INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rep_events (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rep_number INTEGER NOT NULL,
      rom REAL NOT NULL,
      accuracy REAL NOT NULL,
      error_type TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_nick TEXT NOT NULL,
      user_avatar TEXT NOT NULL,
      user_title TEXT,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voice_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      max_users INTEGER NOT NULL DEFAULT 8,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      friend_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_type, item_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_user_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      message_id TEXT,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      identifier TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER NOT NULL,
      blocked_until INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS guest_creation_limits (
      ip TEXT NOT NULL, created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Legacy cleanup: authentication is now represented directly by users.password_hash/password_salt.
  // Safe because the old identity table is no longer referenced anywhere in the application.
  try { db.exec('DROP TABLE IF EXISTS auth_identities;'); } catch {}

  // Migrate existing tables if needed
  try {
    const userCols = db.prepare("PRAGMA table_info(users);").all() as { name: string }[];
    const userColNames = new Set(userCols.map((c) => c.name));
    if (!userColNames.has('onboarding_completed')) {
      db.exec("ALTER TABLE users ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0;");
    }
    if (!userColNames.has('mic_enabled')) {
      db.exec("ALTER TABLE users ADD COLUMN mic_enabled INTEGER NOT NULL DEFAULT 1;");
    }
    if (!userColNames.has('camera_enabled')) {
      db.exec("ALTER TABLE users ADD COLUMN camera_enabled INTEGER NOT NULL DEFAULT 1;");
    }
    if (!userColNames.has('push_to_talk')) {
      db.exec("ALTER TABLE users ADD COLUMN push_to_talk INTEGER NOT NULL DEFAULT 0;");
    }
    if (!userColNames.has('show_skeleton')) {
      db.exec("ALTER TABLE users ADD COLUMN show_skeleton INTEGER NOT NULL DEFAULT 1;");
    }
    if (!userColNames.has('mirror_video')) {
      db.exec("ALTER TABLE users ADD COLUMN mirror_video INTEGER NOT NULL DEFAULT 1;");
    }
    if (!userColNames.has('is_guest')) {
      db.exec("ALTER TABLE users ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 0;");
    }
  } catch {}

  try {
    const progressCols = db.prepare("PRAGMA table_info(progress);").all() as { name: string }[];
    const hasCoins = progressCols.some((col) => col.name === 'coins');
    if (!hasCoins) {
      db.exec("ALTER TABLE progress ADD COLUMN coins INTEGER NOT NULL DEFAULT 250;");
    }
  } catch {}

  // Competition schema and safe legacy achievement migration
  db.exec(`
    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY, exercise_id TEXT NOT NULL, title TEXT NOT NULL,
      starts_at INTEGER NOT NULL, ends_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled',
      prize_xp INTEGER NOT NULL DEFAULT 100, prize_coins INTEGER NOT NULL DEFAULT 100, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS competition_entries (
      id TEXT PRIMARY KEY, competition_id TEXT NOT NULL, user_id TEXT NOT NULL, reps INTEGER NOT NULL DEFAULT 0,
      accuracy REAL NOT NULL DEFAULT 100, score REAL NOT NULL DEFAULT 0, duration_sec INTEGER NOT NULL DEFAULT 60, created_at INTEGER NOT NULL,
      FOREIGN KEY(competition_id) REFERENCES competitions(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(competition_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS competition_attempts (
      nonce TEXT PRIMARY KEY, competition_id TEXT NOT NULL, user_id TEXT NOT NULL, started_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL, reps INTEGER NOT NULL DEFAULT 0, accuracy_sum REAL NOT NULL DEFAULT 0, last_rep_at INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(competition_id) REFERENCES competitions(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY, address TEXT NOT NULL UNIQUE, linked_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS solana_challenges (
      nonce TEXT PRIMARY KEY, user_id TEXT NOT NULL, message TEXT NOT NULL, expires_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL,
      token_mint TEXT, recipient TEXT NOT NULL, reference TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'PENDING',
      transaction_signature TEXT UNIQUE, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, paid_at INTEGER, metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE',
      started_at INTEGER NOT NULL, expires_at INTEGER, payment_id TEXT NOT NULL UNIQUE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(payment_id) REFERENCES payment_orders(id)
    );
    CREATE TABLE IF NOT EXISTS processed_payments (
      transaction_signature TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, processed_at INTEGER NOT NULL,
      FOREIGN KEY(order_id) REFERENCES payment_orders(id) ON DELETE CASCADE
    );
  `);
  const legacy = db.prepare("SELECT id FROM achievements WHERE id='skeleton_slayer'").get() as {id:string}|undefined;
  const winnerExists = db.prepare("SELECT id FROM achievements WHERE id='competition_winner'").get() as {id:string}|undefined;
  if (legacy && !winnerExists) db.prepare("UPDATE achievements SET id='competition_winner', title='Переможець змагань', title_en='Competition Winner', description='Займи перше місце у змаганні', description_en='Finish first in a competition', category='competition', condition_type='competition_wins' WHERE id='skeleton_slayer'").run();
  else if (legacy) db.prepare("DELETE FROM achievements WHERE id='skeleton_slayer'").run();
  db.prepare("INSERT OR IGNORE INTO achievements (id,title,title_en,description,description_en,icon,category,condition_type,condition_value,xp_reward,coins_reward,created_at) VALUES ('competition_winner','Переможець змагань','Competition Winner','Займи перше місце у змаганні','Finish first in a competition','🏆','competition','competition_wins',1,200,300,?)").run(Date.now());
  db.prepare("INSERT OR IGNORE INTO achievements (id,title,title_en,description,description_en,icon,category,condition_type,condition_value,xp_reward,coins_reward,created_at) VALUES ('competition_participant','Учасник змагань','Competition Participant','Візьми участь у першому змаганні','Participate in your first competition','🏅','competition','competition_entries',1,50,75,?)").run(Date.now());

  // Seed default voice rooms if empty
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM voice_rooms').get() as { count: number };
  if (!roomCount || roomCount.count === 0) {
    const insertRoom = db.prepare('INSERT INTO voice_rooms (id, name, max_users, created_at) VALUES (?, ?, ?, ?)');
    insertRoom.run('room_lobby', 'Головне Лобі 🏛️', 16, Date.now());
    insertRoom.run('room_general', 'Загальний зал 💬', 12, Date.now());
    insertRoom.run('room_forge_novices', 'Кузня новачків 🔥', 8, Date.now());
    insertRoom.run('room_sparring_pit', 'Яма спарингів ⚔️', 6, Date.now());
    insertRoom.run('room_iron_brotherhood', 'Залізне братерство 🏋️', 10, Date.now());
  }

  // Seed default shop items if empty
  const shopCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get() as { count: number };
  if (!shopCount || shopCount.count === 0) {
    const insertItem = db.prepare(`
      INSERT INTO shop_items (id, name, name_en, description, description_en, category, price, icon, preview_color, effect_type, effect_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    // Avatars
    insertItem.run('avatar_skeleton', 'Скелетрон Незламний', 'Unbreakable Skeletron', 'Містичний бойовий аватар переможця темних підземель', 'Mystic battle avatar of the dungeon champion', 'avatar', 150, '💀', '#A855F7', 'avatar', '💀', now);
    insertItem.run('avatar_dragon', 'Вогняний Дракон', 'Inferno Dragon', 'Символ люті та невгамовного вогню м’язів', 'Symbol of unstoppable muscle fury', 'avatar', 250, '🐉', '#EF4444', 'avatar', '🐉', now);
    insertItem.run('avatar_thor', 'Громовержець Тор', 'Thunder Thor', 'Божественна сила блискавки та вибухова міць', 'Godly lightning power and explosive strength', 'avatar', 300, '⚡', '#3B82F6', 'avatar', '⚡', now);
    insertItem.run('avatar_cyborg', 'Кіборг Модель Т-800', 'Cyborg Model T-800', 'Титан із загартованого титану та гідравліки', 'Titan of tempered titanium and hydraulics', 'avatar', 200, '🦾', '#10B981', 'avatar', '🦾', now);
    insertItem.run('avatar_fenrir', 'Північний Вовк Фенрір', 'Nordic Wolf Fenrir', 'Хижак, що ніколи не здається у запеклих дуелях', 'Predator that never yields in fierce duels', 'avatar', 180, '🐺', '#6366F1', 'avatar', '🐺', now);

    // Themes
    insertItem.run('theme_molten_core', 'Розпечена Лава', 'Molten Lava Theme', 'Ексклюзивний дизайн інтерфейсу у відтінках вулканічної магми', 'Exclusive molten magma UI theme', 'theme', 400, '🌋', '#FF6B00', 'theme', 'molten', now);
    insertItem.run('theme_cyber_neon', 'Кіберпанк Неон', 'Cyberpunk Neon', 'Сяючі неонові контури та високотехнологічний стиль', 'Glowing neon outlines and high-tech style', 'theme', 350, '🌌', '#EC4899', 'theme', 'neon', now);
    insertItem.run('theme_iron_monolith', 'Залізний Моноліт', 'Iron Monolith', 'Строгий матовий метал для справжніх важкоатлетів', 'Strict matte metal for true heavy lifters', 'theme', 300, '🗿', '#64748B', 'theme', 'monolith', now);

    // Battle Auras
    insertItem.run('aura_fire_sparks', 'Вогняні Іскри', 'Fire Sparks Aura', 'Шлейф палаючих іскор при кожному зарахованому повторі', 'Trail of burning sparks on each valid rep', 'aura', 250, '🔥', '#F97316', 'aura', 'fire', now);
    insertItem.run('aura_golden_crown', 'Золоте Сяйво Чемпіона', 'Champion Golden Aura', 'Королівський золотий ореол під час битви 1v1', 'Royal golden glow during 1v1 battles', 'aura', 500, '👑', '#FACC15', 'aura', 'gold', now);
  }

  // Seed default achievements if empty
  const achCount = db.prepare('SELECT COUNT(*) as count FROM achievements').get() as { count: number };
  if (!achCount || achCount.count === 0) {
    const insertAch = db.prepare(`
      INSERT INTO achievements (id, title, title_en, description, description_en, icon, category, condition_type, condition_value, xp_reward, coins_reward, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    insertAch.run('first_battle', 'Перша кров', 'First Blood', 'Проведи свій перший бій у Forge Battle', 'Complete your first battle in Forge Battle', '⚔️', 'battle', 'battles_count', 1, 50, 100, now);
    insertAch.run('first_win', 'Переможець', 'First Victory', 'Здобудь свою першу перемогу в дуелі', 'Claim your first victory in a duel', '🏆', 'battle', 'wins_count', 1, 100, 150, now);
    insertAch.run('competition_winner', 'Переможець змагань', 'Competition Winner', 'Займи перше місце у змаганні', 'Finish first in a competition', '🏆', 'competition', 'competition_wins', 1, 200, 300, now);
    insertAch.run('competition_participant', 'Учасник змагань', 'Competition Participant', 'Візьми участь у першому змаганні', 'Participate in your first competition', '🏅', 'competition', 'competition_entries', 1, 50, 75, now);
    insertAch.run('veteran', 'Ветеран Кузні', 'Forge Veteran', 'Проведи 10 повноцінних боїв на платформі', 'Complete 10 full battles on the platform', '🎖️', 'battle', 'battles_count', 10, 300, 400, now);
    insertAch.run('champion', 'Непереможний Чемпіон', 'Unstoppable Champion', 'Здобудь 5 перемог у дуелях', 'Achieve 5 duel victories', '👑', 'battle', 'wins_count', 5, 500, 600, now);
    insertAch.run('perfect_battle', 'Бездоганний Бій', 'Flawless Form', 'Заверши бій із середньою точністю ROM 100%', 'Finish a match with 100% average ROM accuracy', '🎯', 'battle', 'perfect_accuracy', 1, 250, 350, now);
    insertAch.run('collector', 'Колекціонер', 'Collector', 'Придбай свій перший предмет у магазині Forge', 'Purchase your first item in the Forge Shop', '🛍️', 'shop', 'items_owned', 1, 150, 200, now);
    insertAch.run('social', 'Душа Компанії', 'Social Titan', 'Надішли 5 повідомлень у чаті спільноти', 'Send 5 messages in community chat', '💬', 'social', 'chat_messages', 5, 100, 100, now);
    insertAch.run('voice_master', 'Голос Кузні', 'Voice of the Forge', 'Приєднайся до голосової кімнати та поспілкуйся', 'Join a live voice room and train with allies', '🎙️', 'voice', 'voice_joined', 1, 100, 150, now);
    insertAch.run('iron_will', 'Залізна Воля', 'Iron Will', 'Виконай 50 повторень вправ сумарно', 'Complete 50 total exercise repetitions', '🦾', 'fitness', 'total_reps', 50, 400, 500, now);
  }
}
