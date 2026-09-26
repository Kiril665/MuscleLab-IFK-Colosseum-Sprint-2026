import { SupportedLanguage } from '../types';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }
];

type TranslationDictionary = Record<string, any>;

const translations: Record<SupportedLanguage, TranslationDictionary> = {
  uk: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Калістеніка та Залізна Кузня',
      loading: 'Завантаження...',
      save: 'Зберегти',
      saved: 'Збережено',
      cancel: 'Скасувати',
      confirm: 'Підтвердити',
      delete: 'Видалити',
      edit: 'Редагувати',
      close: 'Закрити',
      back: 'Назад',
      next: 'Далі',
      search: 'Пошук...',
      filter: 'Фільтр',
      all: 'Всі',
      verified: 'Верифіковано',
      disputed: 'Диспут',
      rejected: 'Відхилено',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'AI Симулятор (Демо)',
      demoNotice: 'Режим демонстрації: прогрес та нагороди не нараховуються',
      level: 'Рівень',
      xp: 'XP',
      reps: 'повторень',
      streak: 'Днів серії',
      error: 'Помилка',
      success: 'Успішно',
      copy: 'Скопіювати',
      copied: 'Скопійовано!',
      comingSoon: 'Незабаром'
    },
    nav: {
      home: 'Головна',
      exercises: 'Каталог Вправ',
      workout: 'Камера Тренування',
      battle: 'Бойова Арена',
      leaderboard: 'Ліга Лідерів',
      passport: 'Solana Паспорт',
      profile: 'Мій Профіль',
      settings: 'Налаштування',
      wardrobe: 'Гардероб Скінів',
      community: 'Спільнота',
      help: 'Довідка',
      logout: 'Вийти'
    },
    settings: {
      title: '# Налаштування Акаунта',
      subtitle: 'Повний контроль над даними атлета, безпекою, мовою, темою та гаманцем',
      saveChanges: 'Зберегти зміни',
      savedInCloud: 'Збережено в хмарі!',
      saving: 'Збереження...',
      tabs: {
        profile: 'Профіль',
        profileDesc: 'Аватар, імʼя, біографія, дисципліна',
        appearance: 'Вигляд та Мова',
        appearanceDesc: 'Мова інтерфейсу, тема кузні',
        email: 'Email',
        emailDesc: 'Привʼязана адреса, верифікація',
        security: 'Безпека',
        securityDesc: 'Пароль scrypt, активні сесії',
        privacy: 'Приватність',
        privacyDesc: 'Видимість статистики та ліги',
        wallet: 'Solana Web3',
        walletDesc: 'Phantom / Solflare гаманець',
        notifications: 'Сповіщення',
        notificationsDesc: 'Дуелі, тренування, досягнення',
        account: 'Акаунт',
        accountDesc: 'ID, статус, небезпечна зона'
      },
      avatar: {
        title: 'Аватар атлета (Avatar)',
        googlePhoto: 'Google фото',
        chooseStyle: 'Оберіть стиль кузні:',
        uploadBtn: 'Завантажити фото з файлу',
        urlPlaceholder: 'Або вставте пряме URL зображення...',
        cropTitle: 'Налаштування та кадрування аватара',
        zoom: 'Масштаб (Zoom)',
        applyCrop: 'Застосувати аватар',
        removeAvatar: 'Видалити аватар',
        resetConfirm: 'Аватар скинуто до стандартного Forge значка.',
        errFormat: 'Підтримуються лише формати PNG, JPG, JPEG або WEBP.',
        errSize: 'Розмір файлу перевищує 3 МБ. Оберіть менше фото.',
        errLoad: 'Не вдалося завантажити зображення. Спробуйте інший файл.'
      },
      profileForm: {
        username: 'Username (Унікальний логін)',
        usernameHelp: 'Латинські літери, цифри та _ (зміна лімітована для захисту рейтингу).',
        displayName: 'Display Name (Імʼя на екрані)',
        displayNameHelp: 'Відображається у бойових дуелях, таблицях лідерів та чатах.',
        discipline: 'Бойовий Напрямок / Дисципліна',
        bio: 'Біографія атлета (Bio)',
        bioPlaceholder: 'Розкажи про свої спортивні цілі, улюблені вправи та шлях у кузні...'
      },
      appearance: {
        title: 'Мова та Оформлення Інтерфейсу',
        subtitle: 'Оберіть зручну мову та колірну схему ForgeMuscle',
        langTitle: 'Мова інтерфейсу (Language)',
        langAutoNotice: 'Мова визначається автоматично за налаштуваннями вашого браузера або вручну.',
        themeTitle: 'Тема оформлення (Theme)',
        themeDark: 'Dark Forge (Темна Кузня)',
        themeDarkDesc: 'Фірмовий темний метал з неоновими амбровими акцентами',
        themeLight: 'Light Steel (Світла Сталь)',
        themeLightDesc: 'Висококонтрастний сталевий інтерфейс для яскравого освітлення',
        themeSystem: 'System Default (Системна)',
        themeSystemDesc: 'Автоматичне перемикання за налаштуваннями операційної системи'
      },
      security: {
        title: 'Безпека та Сесії (Security)',
        subtitle: 'Криптографічний захист пароля стандарту scrypt, активні сесії та керування входами',
        changePass: 'Зміна пароля',
        showPass: 'Показати',
        hidePass: 'Приховати',
        currentPass: 'Поточний пароль',
        newPass: 'Новий пароль (хв. 6)',
        confirmPass: 'Підтвердження пароля',
        updatePassBtn: 'Оновити пароль',
        sessionsTitle: 'Активні сесії (Active Sessions)',
        logoutAll: 'Вийти з усіх інших пристроїв',
        currentDevice: 'Поточний пристрій',
        revoke: 'Відкликати'
      },
      privacy: {
        title: 'Приватність та Видимість (Privacy)',
        subtitle: 'Керування видимістю профілю, тренувальних результатів та бойової статистики',
        profileVis: 'Видимість профілю атлета',
        visPublic: 'Публічний (Всі атлети бачать профіль)',
        visFriends: 'Тільки друзі та гільдія',
        visPrivate: 'Приватний (Приховано з глобальних списків)',
        showStats: 'Відображати загальну статистику в рейтингу ліги',
        showBattleStats: 'Показувати історію перемог та поразок на бойовій арені',
        showAchievements: 'Відкрити досягнення та нагороди для інших атлетів',
        onlineStatus: 'Показувати статус «В мережі» для спарингу'
      },
      wallet: {
        title: 'Solana Web3 Гаманець',
        subtitle: 'Привʼязка криптографічного гаманця для ончейн-підтвердження тренувань (Proof-of-Workout)',
        connected: 'Гаманець підключено',
        notConnected: 'Гаманець не підключено',
        address: 'Публічна адреса (Public Key):',
        network: 'Мережа Solana:',
        connectBtn: 'Підключити Phantom / Solflare',
        disconnectBtn: 'Відʼєднати гаманець',
        viewExplorer: 'Переглянути в Solana Explorer',
        securityNote: 'Приватні ключі ніколи не передаються на сервер. Записуються лише хеші доказів тренувань без біометрії.'
      },
      notifications: {
        title: 'Сповіщення (Notifications)',
        subtitle: 'Гнучке налаштування сповіщень про дуелі, тренування та досягнення',
        workoutReminders: 'Нагадування про щоденні тренування та збереження серії',
        battleAlerts: 'Сповіщення про виклики на бойову дуель 1v1',
        achievements: 'Повідомлення про нові відкриті досягнення та трофеї',
        community: 'Відповіді у спільноті та коментарі до постів',
        guild: 'Гільдійські рейди та спільні змагання',
        systemUpdates: 'Системні оновлення платформи та нові вправи'
      },
      account: {
        title: 'Керування Обліковим Записом',
        subtitle: 'Ідентифікатор атлета, статус підписки та небезпечна зона',
        accountId: 'ID облікового запису:',
        createdAt: 'Дата реєстрації:',
        role: 'Роль в системі:',
        logoutTitle: 'Вихід з акаунта',
        logoutDesc: 'Завершити поточну сесію на цьому пристрої.',
        logoutBtn: 'Вийти з облікового запису',
        dangerZone: 'Небезпечна зона (Danger Zone)',
        deleteTitle: 'Видалення облікового запису',
        deleteDesc: 'Безповоротне видалення профілю, статистики, історії тренувань та досягнень.',
        deleteBtn: 'Видалити акаунт назавжди',
        deleteModalTitle: 'Підтвердження видалення акаунта',
        deleteModalWarning: 'Ця дія є остаточною та незворотною. Всі ваші верифіковані повторення, рівень Forge, історія та титули будуть стерті.',
        deleteModalPrompt: 'Введіть ваш username',
        deleteModalPlaceholder: 'Введіть username для підтвердження'
      }
    },
    workout: {
      startWorkout: 'Почати тренування',
      cameraSetup: 'Підготовка камери',
      allowCamera: 'Надайте дозвіл на використання камери для трекінгу позиції',
      calibration: 'Калібрування положення',
      stepBack: 'Відійдіть назад, щоб усе тіло потрапило в кадр',
      getReady: 'Приготуйтеся!',
      repCount: 'Зараховано',
      rejectedReps: 'Відхилено',
      formFeedback: 'Аналіз техніки',
      accuracy: 'Точність',
      finishWorkout: 'Завершити тренування',
      pressEscToExit: 'Натисніть Esc для виходу',
      resultTitle: 'Результати тренування',
      xpEarned: 'Отримано досвіду',
      proofOfWorkout: 'Криптографічний доказ тренування',
      livenessPassed: 'Перевірку живої присутності пройдено'
    },
    battle: {
      title: 'Бойова Арена 1v1',
      subtitle: 'Змагання у реальному часі з компʼютерним зором та арбітражем',
      findOpponent: 'Знайти суперника',
      matchmaking: 'Пошук суперника...',
      ready: 'Готовий!',
      winner: 'Переможець',
      draw: 'Нічия',
      aiSparring: 'AI Тренувальний Спаринг (Демо)',
      aiSparringNotice: 'Тренувальний режим з ботом. Очки ліги та реальний XP нараховуються лише у змаганнях з живими атлетами.'
    },
    leaderboard: {
      title: 'Глобальна Ліга Кузні',
      subtitle: 'Реальний рейтинг найсильніших атлетів платформи',
      rank: 'Місце',
      athlete: 'Атлет',
      verifiedVolume: 'Верифікований обʼєм',
      battlesWon: 'Перемог у битвах',
      weekly: 'Цього тижня',
      monthly: 'За місяць',
      allTime: 'За весь час'
    }
  },

  en: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Calisthenics & Iron Forge',
      loading: 'Loading...',
      save: 'Save Changes',
      saved: 'Saved',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      verified: 'Verified',
      disputed: 'Disputed',
      rejected: 'Rejected',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'AI Simulator (Demo)',
      demoNotice: 'Demonstration mode: progress and rewards are disabled',
      level: 'Level',
      xp: 'XP',
      reps: 'reps',
      streak: 'Day Streak',
      error: 'Error',
      success: 'Success',
      copy: 'Copy',
      copied: 'Copied!',
      comingSoon: 'Coming Soon'
    },
    nav: {
      home: 'Home',
      exercises: 'Exercise Hub',
      workout: 'Camera Workout',
      battle: 'Battle Arena',
      leaderboard: 'Leaderboard',
      passport: 'Solana Passport',
      profile: 'My Profile',
      settings: 'Settings',
      wardrobe: 'Wardrobe Skins',
      community: 'Community',
      help: 'Help Center',
      logout: 'Logout'
    },
    settings: {
      title: '# Account Settings',
      subtitle: 'Full control over athlete profile, security, language, theme & Web3 wallet',
      saveChanges: 'Save Changes',
      savedInCloud: 'Saved to cloud!',
      saving: 'Saving...',
      tabs: {
        profile: 'Profile',
        profileDesc: 'Avatar, name, bio, discipline',
        appearance: 'Appearance & Language',
        appearanceDesc: 'UI language, forge theme',
        email: 'Email',
        emailDesc: 'Connected address, verification',
        security: 'Security',
        securityDesc: 'scrypt password, active sessions',
        privacy: 'Privacy',
        privacyDesc: 'Profile & battle stats visibility',
        wallet: 'Solana Web3',
        walletDesc: 'Phantom / Solflare wallet',
        notifications: 'Notifications',
        notificationsDesc: 'Duels, workouts, achievements',
        account: 'Account',
        accountDesc: 'ID, status, danger zone'
      },
      avatar: {
        title: 'Athlete Avatar',
        googlePhoto: 'Google photo',
        chooseStyle: 'Choose forge style:',
        uploadBtn: 'Upload photo from file',
        urlPlaceholder: 'Or paste direct image URL...',
        cropTitle: 'Adjust and Crop Avatar',
        zoom: 'Zoom',
        applyCrop: 'Apply Avatar',
        removeAvatar: 'Remove Avatar',
        resetConfirm: 'Avatar reset to default Forge emblem.',
        errFormat: 'Only PNG, JPG, JPEG or WEBP formats are supported.',
        errSize: 'File size exceeds 3 MB. Please choose a smaller image.',
        errLoad: 'Failed to load image. Please try another file.'
      },
      profileForm: {
        username: 'Username (Unique handle)',
        usernameHelp: 'Latin letters, numbers and _ (limited changes to protect leaderboard integrity).',
        displayName: 'Display Name',
        displayNameHelp: 'Shown in 1v1 battle duels, leaderboards and community feeds.',
        discipline: 'Combat Discipline',
        bio: 'Athlete Bio',
        bioPlaceholder: 'Share your fitness journey, favorite exercises and training goals...'
      },
      appearance: {
        title: 'Interface Language & Appearance',
        subtitle: 'Choose your preferred language and ForgeMuscle color scheme',
        langTitle: 'Interface Language',
        langAutoNotice: 'Language is detected automatically from your browser settings or set manually.',
        themeTitle: 'Forge Theme',
        themeDark: 'Dark Forge',
        themeDarkDesc: 'Signature dark metallic steel with amber forge neon glow',
        themeLight: 'Light Steel',
        themeLightDesc: 'High-contrast steel interface designed for bright daylight',
        themeSystem: 'System Default',
        themeSystemDesc: 'Automatically follows your operating system preference'
      },
      security: {
        title: 'Security & Active Sessions',
        subtitle: 'scrypt cryptographic password protection, active devices and session management',
        changePass: 'Change Password',
        showPass: 'Show',
        hidePass: 'Hide',
        currentPass: 'Current Password',
        newPass: 'New Password (min 6)',
        confirmPass: 'Confirm Password',
        updatePassBtn: 'Update Password',
        sessionsTitle: 'Active Sessions',
        logoutAll: 'Log out from all other devices',
        currentDevice: 'Current Device',
        revoke: 'Revoke'
      },
      privacy: {
        title: 'Privacy & Visibility',
        subtitle: 'Control profile visibility, workout telemetry and battle arena statistics',
        profileVis: 'Profile Visibility',
        visPublic: 'Public (Visible to all athletes)',
        visFriends: 'Friends & Guild Only',
        visPrivate: 'Private (Hidden from global rankings)',
        showStats: 'Show workout statistics in leaderboard rankings',
        showBattleStats: 'Display win/loss record in Battle Arena',
        showAchievements: 'Make unlocked trophies public to other athletes',
        onlineStatus: 'Show "Online" status for sparring challenges'
      },
      wallet: {
        title: 'Solana Web3 Wallet',
        subtitle: 'Connect cryptographic wallet for on-chain Proof-of-Workout memo verification',
        connected: 'Wallet Connected',
        notConnected: 'Wallet Not Connected',
        address: 'Public Key:',
        network: 'Solana Network:',
        connectBtn: 'Connect Phantom / Solflare',
        disconnectBtn: 'Disconnect Wallet',
        viewExplorer: 'View on Solana Explorer',
        securityNote: 'Private keys never leave your browser. Only cryptographic proof hashes are published without biometric data.'
      },
      notifications: {
        title: 'Notifications',
        subtitle: 'Granular controls for battle duel alerts, workouts and achievements',
        workoutReminders: 'Daily workout reminders and streak preservation',
        battleAlerts: '1v1 Battle Arena incoming duel challenges',
        achievements: 'New trophy unlocks and milestone celebrations',
        community: 'Community replies, mentions and comments',
        guild: 'Guild raids and team events',
        systemUpdates: 'Platform updates and newly added verified exercises'
      },
      account: {
        title: 'Account Management',
        subtitle: 'Athlete identifier, membership status and danger zone',
        accountId: 'Account ID:',
        createdAt: 'Registration Date:',
        role: 'Account Role:',
        logoutTitle: 'Log Out',
        logoutDesc: 'End your current session on this device.',
        logoutBtn: 'Log Out of Account',
        dangerZone: 'Danger Zone',
        deleteTitle: 'Delete Account',
        deleteDesc: 'Permanently remove your athlete profile, verified volume, streaks and trophies.',
        deleteBtn: 'Delete Account Permanently',
        deleteModalTitle: 'Confirm Account Deletion',
        deleteModalWarning: 'This action is irreversible. All your verified reps, Forge tier levels, logs and titles will be erased forever.',
        deleteModalPrompt: 'Type your username to confirm',
        deleteModalPlaceholder: 'Enter username to confirm'
      }
    },
    workout: {
      startWorkout: 'Start Workout',
      cameraSetup: 'Camera Setup',
      allowCamera: 'Please allow camera access to enable real-time pose tracking',
      calibration: 'Position Calibration',
      stepBack: 'Step back until your entire body is visible in the frame',
      getReady: 'Get Ready!',
      repCount: 'Valid Reps',
      rejectedReps: 'Rejected',
      formFeedback: 'Form Feedback',
      accuracy: 'Accuracy',
      finishWorkout: 'Finish Workout',
      pressEscToExit: 'Press Esc to exit',
      resultTitle: 'Workout Summary',
      xpEarned: 'XP Earned',
      proofOfWorkout: 'Proof of Workout Certificate',
      livenessPassed: 'Liveness anti-spoof challenge passed'
    },
    battle: {
      title: '1v1 Battle Arena',
      subtitle: 'Real-time computer vision competition with cryptographic referee',
      findOpponent: 'Find Opponent',
      matchmaking: 'Searching for opponent...',
      ready: 'Ready!',
      winner: 'Winner',
      draw: 'Draw',
      aiSparring: 'AI Sparring Bot (Demo)',
      aiSparringNotice: 'Demo sparring mode. League points and verified XP are awarded only against real human athletes.'
    },
    leaderboard: {
      title: 'Global Forge League',
      subtitle: 'Real verified rankings of the strongest calisthenics & iron athletes',
      rank: 'Rank',
      athlete: 'Athlete',
      verifiedVolume: 'Verified Volume',
      battlesWon: 'Battles Won',
      weekly: 'This Week',
      monthly: 'This Month',
      allTime: 'All Time'
    }
  },

  pl: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Kalistenika i Żelazna Kuźnia',
      loading: 'Ładowanie...',
      save: 'Zapisz zmiany',
      saved: 'Zapisano',
      cancel: 'Anuluj',
      confirm: 'Potwierdź',
      delete: 'Usuń',
      edit: 'Edytuj',
      close: 'Zamknij',
      back: 'Wstecz',
      next: 'Dalej',
      search: 'Szukaj...',
      filter: 'Filtr',
      all: 'Wszystkie',
      verified: 'Zweryfikowano',
      disputed: 'Sporne',
      rejected: 'Odrzucono',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'Symulator AI (Demo)',
      demoNotice: 'Tryb demonstracyjny: postęp i nagrody są wyłączone',
      level: 'Poziom',
      xp: 'XP',
      reps: 'powtórzeń',
      streak: 'Dni passy',
      error: 'Błąd',
      success: 'Sukces',
      copy: 'Kopiuj',
      copied: 'Skopiowano!',
      comingSoon: 'Wkrótce'
    },
    nav: {
      home: 'Główna',
      exercises: 'Katalog Ćwiczeń',
      workout: 'Trening z Kamerą',
      battle: 'Arena Walk',
      leaderboard: 'Ranking Ligi',
      passport: 'Paszport Solana',
      profile: 'Mój Profil',
      settings: 'Ustawienia',
      wardrobe: 'Garderoba Skórek',
      community: 'Społeczność',
      help: 'Pomoc',
      logout: 'Wyloguj'
    },
    settings: {
      title: '# Ustawienia Konta',
      subtitle: 'Pełna kontrola nad profilem, bezpieczeństwem, językiem, motywem i portfelem Web3',
      saveChanges: 'Zapisz zmiany',
      savedInCloud: 'Zapisano w chmurze!',
      saving: 'Zapisywanie...',
      tabs: {
        profile: 'Profil',
        profileDesc: 'Awatar, imię, bio, dyscyplina',
        appearance: 'Wygląd i Język',
        appearanceDesc: 'Język interfejsu, motyw kuźni',
        email: 'Email',
        emailDesc: 'Powiązany adres, weryfikacja',
        security: 'Bezpieczeństwo',
        securityDesc: 'Hasło scrypt, aktywne sesje',
        privacy: 'Prywatność',
        privacyDesc: 'Widoczność statystyk i ligi',
        wallet: 'Solana Web3',
        walletDesc: 'Portfel Phantom / Solflare',
        notifications: 'Powiadomienia',
        notificationsDesc: 'Pojedynki, treningi, osiągnięcia',
        account: 'Konto',
        accountDesc: 'ID, status, strefa zagrożenia'
      },
      avatar: {
        title: 'Awatar sportowca',
        googlePhoto: 'Zdjęcie Google',
        chooseStyle: 'Wybierz styl kuźni:',
        uploadBtn: 'Wgraj zdjęcie z pliku',
        urlPlaceholder: 'Lub wklej bezpośredni adres URL...',
        cropTitle: 'Dostosuj i przytnij awatar',
        zoom: 'Powiększenie (Zoom)',
        applyCrop: 'Zastosuj awatar',
        removeAvatar: 'Usuń awatar',
        resetConfirm: 'Awatar zresetowany do domyślnego znaku Kuźni.',
        errFormat: 'Obsługiwane są tylko formaty PNG, JPG, JPEG lub WEBP.',
        errSize: 'Rozmiar pliku przekracza 3 MB. Wybierz mniejsze zdjęcie.',
        errLoad: 'Nie udało się załadować obrazu.'
      },
      profileForm: {
        username: 'Nazwa użytkownika (Username)',
        usernameHelp: 'Litery łacińskie, cyfry i _',
        displayName: 'Wyświetlana nazwa',
        displayNameHelp: 'Widoczna w pojedynkach, tabeli liderów i społeczności.',
        discipline: 'Dyscyplina treningowa',
        bio: 'Biografia sportowca',
        bioPlaceholder: 'Opowiedz o swoich celach treningowych...'
      },
      appearance: {
        title: 'Język i Wygląd Interfejsu',
        subtitle: 'Wybierz preferowany język oraz schemat kolorystyczny ForgeMuscle',
        langTitle: 'Język interfejsu (Language)',
        langAutoNotice: 'Język jest wykrywany automatycznie z przeglądarki lub ustawiany ręcznie.',
        themeTitle: 'Motyw Kuźni (Theme)',
        themeDark: 'Dark Forge (Ciemna Kuźnia)',
        themeDarkDesc: 'Charakterystyczny ciemny metal z bursztynowym neonem',
        themeLight: 'Light Steel (Jasna Stal)',
        themeLightDesc: 'Wysokokontrastowy stalowy interfejs',
        themeSystem: 'Systemowy (Domyślny)',
        themeSystemDesc: 'Automatycznie dopasowuje się do motywu systemu'
      },
      security: {
        title: 'Bezpieczeństwo i Sesje',
        subtitle: 'Kryptograficzna ochrona hasła scrypt i zarządzanie sesjami',
        changePass: 'Zmień hasło',
        showPass: 'Pokaż',
        hidePass: 'Ukryj',
        currentPass: 'Aktualne hasło',
        newPass: 'Nowe hasło (min. 6)',
        confirmPass: 'Potwierdź nowe hasło',
        updatePassBtn: 'Zaktualizuj hasło',
        sessionsTitle: 'Aktywne sesje',
        logoutAll: 'Wyloguj ze wszystkich innych urządzeń',
        currentDevice: 'Bieżące urządzenie',
        revoke: 'Odwołaj'
      },
      privacy: {
        title: 'Prywatność i Widoczność',
        subtitle: 'Kontrola widoczności profilu, wyników i statystyk pojedynków',
        profileVis: 'Widoczność profilu',
        visPublic: 'Publiczny (Widoczny dla wszystkich)',
        visFriends: 'Tylko znajomi i gildia',
        visPrivate: 'Prywatny (Ukryty w rankingach)',
        showStats: 'Pokaż statystyki treningowe w rankingu',
        showBattleStats: 'Pokaż bilans walk na arenie',
        showAchievements: 'Udostępnij osiągnięcia innym',
        onlineStatus: 'Pokaż status online do sparingów'
      },
      wallet: {
        title: 'Portfel Solana Web3',
        subtitle: 'Połącz portfel do weryfikacji Proof-of-Workout on-chain',
        connected: 'Portfel połączony',
        notConnected: 'Portfel niepołączony',
        address: 'Klucz publiczny:',
        network: 'Sieć Solana:',
        connectBtn: 'Połącz Phantom / Solflare',
        disconnectBtn: 'Odłącz portfel',
        viewExplorer: 'Zobacz w Solana Explorer',
        securityNote: 'Klucze prywatne nigdy nie opuszczają przeglądarki.'
      },
      notifications: {
        title: 'Powiadomienia',
        subtitle: 'Powiadomienia o pojedynkach, treningach i osiągnięciach',
        workoutReminders: 'Przypomnienia o treningu i serii dni',
        battleAlerts: 'Wyzwania na pojedynki 1v1',
        achievements: 'Nowe odblokowane osiągnięcia',
        community: 'Odpowiedzi w społeczności i komentarze',
        guild: 'Rajdy gildyjne i wydarzenia',
        systemUpdates: 'Aktualizacje platformy i nowe ćwiczenia'
      },
      account: {
        title: 'Zarządzanie Kontem',
        subtitle: 'Identyfikator sportowca, status i strefa zagrożenia',
        accountId: 'ID Konta:',
        createdAt: 'Data rejestracji:',
        role: 'Rola w systemie:',
        logoutTitle: 'Wylogowanie',
        logoutDesc: 'Zakończ bieżącą sesję na tym urządzeniu.',
        logoutBtn: 'Wyloguj się z konta',
        dangerZone: 'Strefa Zagrożenia',
        deleteTitle: 'Usuń Konto',
        deleteDesc: 'Trwałe usunięcie profilu, powtórzeń, passy i osiągnięć.',
        deleteBtn: 'Usuń konto na zawsze',
        deleteModalTitle: 'Potwierdzenie usunięcia konta',
        deleteModalWarning: 'Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną skasowane.',
        deleteModalPrompt: 'Wpisz swoją nazwę użytkownika',
        deleteModalPlaceholder: 'Wpisz username aby potwierdzić'
      }
    },
    workout: {
      startWorkout: 'Rozpocznij Trening',
      cameraSetup: 'Przygotowanie Kamery',
      allowCamera: 'Zezwól na dostęp do kamery, aby śledzić sylwetkę',
      calibration: 'Kalibracja Pozycji',
      stepBack: 'Cofnij się, aby całe ciało było widoczne w kadrze',
      getReady: 'Przygotuj się!',
      repCount: 'Zaliczono',
      rejectedReps: 'Odrzucono',
      formFeedback: 'Analiza Techniki',
      accuracy: 'Dokładność',
      finishWorkout: 'Zakończ Trening',
      pressEscToExit: 'Naciśnij Esc, aby wyjść',
      resultTitle: 'Podsumowanie Treningu',
      xpEarned: 'Zdobyte XP',
      proofOfWorkout: 'Dowód Treningu Proof-of-Workout',
      livenessPassed: 'Test obecności liveness zaliczony'
    },
    battle: {
      title: 'Arena Walk 1v1',
      subtitle: 'Rywalizacja w czasie rzeczywistym z cyfrowym sędzią',
      findOpponent: 'Znajdź Przeciwnika',
      matchmaking: 'Szukanie przeciwnika...',
      ready: 'Gotowy!',
      winner: 'Zwycięzca',
      draw: 'Remis',
      aiSparring: 'Sparing z Botem AI (Demo)',
      aiSparringNotice: 'Tryb demonstracyjny. Punkty ligowe naliczane są tylko z prawdziwymi graczami.'
    },
    leaderboard: {
      title: 'Globalna Liga Kuźni',
      subtitle: 'Prawdziwe rankingi najsilniejszych zawodników',
      rank: 'Pozycja',
      athlete: 'Zawodnik',
      verifiedVolume: 'Zweryfikowana objętość',
      battlesWon: 'Wygrane pojedynki',
      weekly: 'W tym tygodniu',
      monthly: 'W tym miesiącu',
      allTime: 'Wszystkie czasy'
    }
  },

  de: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Calisthenics & Eisenschmiede',
      loading: 'Laden...',
      save: 'Änderungen speichern',
      saved: 'Gespeichert',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      search: 'Suchen...',
      filter: 'Filter',
      all: 'Alle',
      verified: 'Verifiziert',
      disputed: 'Umstritten',
      rejected: 'Abgelehnt',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'KI-Simulator (Demo)',
      demoNotice: 'Demonstrationsmodus: Kein Fortschritt oder Belohnungen',
      level: 'Level',
      xp: 'XP',
      reps: 'Wiederholungen',
      streak: 'Tage Serie',
      error: 'Fehler',
      success: 'Erfolg',
      copy: 'Kopieren',
      copied: 'Kopiert!',
      comingSoon: 'Demnächst'
    },
    nav: {
      home: 'Startseite',
      exercises: 'Übungskatalog',
      workout: 'Kamera-Training',
      battle: 'Kampfarena',
      leaderboard: 'Rangliste',
      passport: 'Solana-Pass',
      profile: 'Mein Profil',
      settings: 'Einstellungen',
      wardrobe: 'Garderobe',
      community: 'Community',
      help: 'Hilfe',
      logout: 'Abmelden'
    },
    settings: {
      title: '# Kontoeinstellungen',
      subtitle: 'Vollständige Kontrolle über Profil, Sicherheit, Sprache, Design & Web3-Wallet',
      saveChanges: 'Änderungen speichern',
      savedInCloud: 'In der Cloud gespeichert!',
      saving: 'Speichern...',
      tabs: {
        profile: 'Profil',
        profileDesc: 'Avatar, Name, Bio, Disziplin',
        appearance: 'Design & Sprache',
        appearanceDesc: 'Sprache der Oberfläche, Schmiedethema',
        email: 'E-Mail',
        emailDesc: 'Verknüpfte Adresse, Verifizierung',
        security: 'Sicherheit',
        securityDesc: 'scrypt-Passwort, aktive Sitzungen',
        privacy: 'Privatsphäre',
        privacyDesc: 'Sichtbarkeit von Profil & Statistiken',
        wallet: 'Solana Web3',
        walletDesc: 'Phantom / Solflare Wallet',
        notifications: 'Benachrichtigungen',
        notificationsDesc: 'Duelle, Workouts, Erfolge',
        account: 'Konto',
        accountDesc: 'ID, Status, Gefahrenzone'
      },
      avatar: {
        title: 'Athleten-Avatar',
        googlePhoto: 'Google-Foto',
        chooseStyle: 'Wähle Schmiede-Stil:',
        uploadBtn: 'Foto aus Datei hochladen',
        urlPlaceholder: 'Oder Bild-URL einfügen...',
        cropTitle: 'Avatar anpassen & zuschneiden',
        zoom: 'Zoom',
        applyCrop: 'Avatar anwenden',
        removeAvatar: 'Avatar entfernen',
        resetConfirm: 'Avatar auf Standardemblem zurückgesetzt.',
        errFormat: 'Nur PNG, JPG, JPEG oder WEBP werden unterstützt.',
        errSize: 'Dateigröße überschreitet 3 MB.',
        errLoad: 'Bild konnte nicht geladen werden.'
      },
      profileForm: {
        username: 'Benutzername (Username)',
        usernameHelp: 'Lateinische Buchstaben, Zahlen und _',
        displayName: 'Anzeigename',
        displayNameHelp: 'Sichtbar in 1v1-Duellen und Ranglisten.',
        discipline: 'Disziplin',
        bio: 'Athleten-Bio',
        bioPlaceholder: 'Teile deine Fitnessreise und Ziele...'
      },
      appearance: {
        title: 'Sprache & Erscheinungsbild',
        subtitle: 'Wähle deine bevorzugte Sprache und dein Farbschema',
        langTitle: 'Sprache der Benutzeroberfläche',
        langAutoNotice: 'Die Sprache wird automatisch über den Browser erkannt oder manuell gewählt.',
        themeTitle: 'Forge-Design (Theme)',
        themeDark: 'Dark Forge (Dunkles Metall)',
        themeDarkDesc: 'Dunkler Stahl mit bernsteinfarbenen Neon-Akzenten',
        themeLight: 'Light Steel (Heller Stahl)',
        themeLightDesc: 'Kontrastreiche Oberfläche für helles Tageslicht',
        themeSystem: 'Systemstandard',
        themeSystemDesc: 'Folgt automatisch den Einstellungen des Betriebssystems'
      },
      security: {
        title: 'Sicherheit & Aktive Sitzungen',
        subtitle: 'scrypt-Passwortschutz und Sitzungsverwaltung',
        changePass: 'Passwort ändern',
        showPass: 'Anzeigen',
        hidePass: 'Ausblenden',
        currentPass: 'Aktuelles Passwort',
        newPass: 'Neues Passwort (mind. 6)',
        confirmPass: 'Passwort bestätigen',
        updatePassBtn: 'Passwort aktualisieren',
        sessionsTitle: 'Aktive Sitzungen',
        logoutAll: 'Von allen anderen Geräten abmelden',
        currentDevice: 'Aktuelles Gerät',
        revoke: 'Widerrufen'
      },
      privacy: {
        title: 'Privatsphäre & Sichtbarkeit',
        subtitle: 'Kontrolle über Profil- und Duellstatistiken',
        profileVis: 'Profilsichtbarkeit',
        visPublic: 'Öffentlich (Für alle sichtbar)',
        visFriends: 'Nur Freunde & Gilde',
        visPrivate: 'Privat (Aus globalen Listen ausgeblendet)',
        showStats: 'Trainingsstatistiken in Ranglisten anzeigen',
        showBattleStats: 'Kampfstatistik in der Arena anzeigen',
        showAchievements: 'Erfolge öffentlich machen',
        onlineStatus: 'Online-Status für Sparrings anzeigen'
      },
      wallet: {
        title: 'Solana Web3 Wallet',
        subtitle: 'Krypto-Wallet für On-Chain Proof-of-Workout verbinden',
        connected: 'Wallet verbunden',
        notConnected: 'Wallet nicht verbunden',
        address: 'Öffentlicher Schlüssel:',
        network: 'Solana-Netzwerk:',
        connectBtn: 'Phantom / Solflare verbinden',
        disconnectBtn: 'Wallet trennen',
        viewExplorer: 'Im Solana Explorer ansehen',
        securityNote: 'Private Schlüssel verlassen niemals den Browser.'
      },
      notifications: {
        title: 'Benachrichtigungen',
        subtitle: 'Einstellungen für Duelle, Workouts und Meilensteine',
        workoutReminders: 'Tägliche Trainingserinnerungen',
        battleAlerts: '1v1-Duell-Herausforderungen',
        achievements: 'Neue freigeschaltete Trophäen',
        community: 'Community-Antworten und Kommentare',
        guild: 'Gilden-Events und Raids',
        systemUpdates: 'Plattform-Updates und neue Übungen'
      },
      account: {
        title: 'Kontoverwaltung',
        subtitle: 'Athleten-ID, Mitgliedschaft und Gefahrenzone',
        accountId: 'Konto-ID:',
        createdAt: 'Registrierungsdatum:',
        role: 'Rolle:',
        logoutTitle: 'Abmelden',
        logoutDesc: 'Aktuelle Sitzung auf diesem Gerät beenden.',
        logoutBtn: 'Konto abmelden',
        dangerZone: 'Gefahrenzone',
        deleteTitle: 'Konto löschen',
        deleteDesc: 'Dauerhaftes Löschen von Profil, Wiederholungen und Erfolgen.',
        deleteBtn: 'Konto unwiderruflich löschen',
        deleteModalTitle: 'Kontolöschung bestätigen',
        deleteModalWarning: 'Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden.',
        deleteModalPrompt: 'Gib deinen Benutzernamen zur Bestätigung ein',
        deleteModalPlaceholder: 'Benutzername eingeben'
      }
    },
    workout: {
      startWorkout: 'Workout starten',
      cameraSetup: 'Kamera-Einrichtung',
      allowCamera: 'Bitte Kamerazugriff für Posen-Tracking erlauben',
      calibration: 'Positionskalibrierung',
      stepBack: 'Trete zurück, bis der gesamte Körper sichtbar ist',
      getReady: 'Mach dich bereit!',
      repCount: 'Gültig',
      rejectedReps: 'Ungültig',
      formFeedback: 'Form-Analyse',
      accuracy: 'Präzision',
      finishWorkout: 'Training beenden',
      pressEscToExit: 'Drücke Esc zum Beenden',
      resultTitle: 'Trainingszusammenfassung',
      xpEarned: 'Verdientes XP',
      proofOfWorkout: 'Proof-of-Workout Zertifikat',
      livenessPassed: 'Lebendigkeitsprüfung bestanden'
    },
    battle: {
      title: '1v1 Kampfarena',
      subtitle: 'Echtzeit-Wettkampf mit Posen-Verifikation',
      findOpponent: 'Gegner suchen',
      matchmaking: 'Gegner wird gesucht...',
      ready: 'Bereit!',
      winner: 'Sieger',
      draw: 'Unentschieden',
      aiSparring: 'KI-Sparring Bot (Demo)',
      aiSparringNotice: 'Demo-Modus. Ranglistenpunkte gibt es nur gegen echte Athleten.'
    },
    leaderboard: {
      title: 'Globale Schmiede-Liga',
      subtitle: 'Verifizierte Rangliste der stärksten Athleten',
      rank: 'Rang',
      athlete: 'Athlet',
      verifiedVolume: 'Verifiziertes Volumen',
      battlesWon: 'Gewonnene Duelle',
      weekly: 'Diese Woche',
      monthly: 'Diesen Monat',
      allTime: 'Gesamt'
    }
  },

  es: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Calistenia y Forja de Hierro',
      loading: 'Cargando...',
      save: 'Guardar cambios',
      saved: 'Guardado',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      back: 'Volver',
      next: 'Siguiente',
      search: 'Buscar...',
      filter: 'Filtro',
      all: 'Todos',
      verified: 'Verificado',
      disputed: 'Disputado',
      rejected: 'Rechazado',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'Simulador IA (Demo)',
      demoNotice: 'Modo demostración: no se otorgan XP ni progreso',
      level: 'Nivel',
      xp: 'XP',
      reps: 'repeticiones',
      streak: 'Días de racha',
      error: 'Error',
      success: 'Éxito',
      copy: 'Copiar',
      copied: '¡Copiado!',
      comingSoon: 'Próximamente'
    },
    nav: {
      home: 'Inicio',
      exercises: 'Catálogo de Ejercicios',
      workout: 'Entrenamiento con Cámara',
      battle: 'Arena de Batalla',
      leaderboard: 'Clasificación',
      passport: 'Pasaporte Solana',
      profile: 'Mi Perfil',
      settings: 'Configuración',
      wardrobe: 'Armario de Aspectos',
      community: 'Comunidad',
      help: 'Ayuda',
      logout: 'Cerrar sesión'
    },
    settings: {
      title: '# Configuración de Cuenta',
      subtitle: 'Control total de perfil, seguridad, idioma, tema y billetera Web3',
      saveChanges: 'Guardar cambios',
      savedInCloud: '¡Guardado en la nube!',
      saving: 'Guardando...',
      tabs: {
        profile: 'Perfil',
        profileDesc: 'Avatar, nombre, biografía, disciplina',
        appearance: 'Apariencia e Idioma',
        appearanceDesc: 'Idioma de interfaz, tema de forja',
        email: 'Email',
        emailDesc: 'Correo vinculado, verificación',
        security: 'Seguridad',
        securityDesc: 'Contraseña scrypt, sesiones activas',
        privacy: 'Privacidad',
        privacyDesc: 'Visibilidad de perfil y estadísticas',
        wallet: 'Solana Web3',
        walletDesc: 'Billetera Phantom / Solflare',
        notifications: 'Notificaciones',
        notificationsDesc: 'Duelos, entrenamientos, logros',
        account: 'Cuenta',
        accountDesc: 'ID, estado, zona de peligro'
      },
      avatar: {
        title: 'Avatar de atleta',
        googlePhoto: 'Foto de Google',
        chooseStyle: 'Elige estilo de forja:',
        uploadBtn: 'Subir foto desde archivo',
        urlPlaceholder: 'O pega la URL de la imagen...',
        cropTitle: 'Ajustar y recortar avatar',
        zoom: 'Zoom',
        applyCrop: 'Aplicar avatar',
        removeAvatar: 'Eliminar avatar',
        resetConfirm: 'Avatar restablecido al emblema por defecto.',
        errFormat: 'Solo se admiten formatos PNG, JPG, JPEG o WEBP.',
        errSize: 'El archivo supera los 3 MB.',
        errLoad: 'No se pudo cargar la imagen.'
      },
      profileForm: {
        username: 'Nombre de usuario (Username)',
        usernameHelp: 'Letras latinas, números y _',
        displayName: 'Nombre visible',
        displayNameHelp: 'Visible en duelos 1v1, tablas de clasificación y comunidad.',
        discipline: 'Disciplina deportiva',
        bio: 'Biografía del atleta',
        bioPlaceholder: 'Cuéntanos sobre tus objetivos de entrenamiento...'
      },
      appearance: {
        title: 'Idioma y Apariencia',
        subtitle: 'Selecciona tu idioma y esquema de colores preferido',
        langTitle: 'Idioma de la interfaz',
        langAutoNotice: 'El idioma se detecta automáticamente según tu navegador o se elige manualmente.',
        themeTitle: 'Tema de la Forja',
        themeDark: 'Dark Forge (Forja Oscura)',
        themeDarkDesc: 'Metal oscuro característico con destellos ámbar',
        themeLight: 'Light Steel (Acero Claro)',
        themeLightDesc: 'Interfaz de acero de alto contraste para luz diurna',
        themeSystem: 'Predeterminado del sistema',
        themeSystemDesc: 'Sigue automáticamente la configuración de tu sistema operativo'
      },
      security: {
        title: 'Seguridad y Sesiones Activas',
        subtitle: 'Protección criptográfica scrypt y gestión de dispositivos',
        changePass: 'Cambiar contraseña',
        showPass: 'Mostrar',
        hidePass: 'Ocultar',
        currentPass: 'Contraseña actual',
        newPass: 'Nueva contraseña (mín. 6)',
        confirmPass: 'Confirmar contraseña',
        updatePassBtn: 'Actualizar contraseña',
        sessionsTitle: 'Sesiones activas',
        logoutAll: 'Cerrar sesión en todos los demás dispositivos',
        currentDevice: 'Dispositivo actual',
        revoke: 'Revocar'
      },
      privacy: {
        title: 'Privacidad y Visibilidad',
        subtitle: 'Control sobre la visibilidad de tu perfil y estadísticas',
        profileVis: 'Visibilidad del perfil',
        visPublic: 'Público (Visible para todos)',
        visFriends: 'Solo amigos y gremio',
        visPrivate: 'Privado (Oculto en tablas globales)',
        showStats: 'Mostrar estadísticas en la clasificación',
        showBattleStats: 'Mostrar historial de duelos en la arena',
        showAchievements: 'Hacer públicos los logros',
        onlineStatus: 'Mostrar estado en línea para duelos'
      },
      wallet: {
        title: 'Billetera Solana Web3',
        subtitle: 'Conecta tu billetera para verificación Proof-of-Workout on-chain',
        connected: 'Billetera conectada',
        notConnected: 'Billetera no conectada',
        address: 'Clave pública:',
        network: 'Red Solana:',
        connectBtn: 'Conectar Phantom / Solflare',
        disconnectBtn: 'Desconectar billetera',
        viewExplorer: 'Ver en Solana Explorer',
        securityNote: 'Las claves privadas nunca salen de tu navegador.'
      },
      notifications: {
        title: 'Notificaciones',
        subtitle: 'Configura avisos de duelos, entrenamientos y trofeos',
        workoutReminders: 'Recordatorios diarios y conservación de racha',
        battleAlerts: 'Desafíos de duelo 1v1',
        achievements: 'Nuevos trofeos desbloqueados',
        community: 'Respuestas en comunidad y comentarios',
        guild: 'Eventos de gremio y asaltos',
        systemUpdates: 'Actualizaciones y nuevos ejercicios'
      },
      account: {
        title: 'Gestión de Cuenta',
        subtitle: 'Identificador de atleta, estado y zona de peligro',
        accountId: 'ID de cuenta:',
        createdAt: 'Fecha de registro:',
        role: 'Rol:',
        logoutTitle: 'Cerrar Sesión',
        logoutDesc: 'Terminar la sesión actual en este dispositivo.',
        logoutBtn: 'Cerrar sesión',
        dangerZone: 'Zona de Peligro',
        deleteTitle: 'Eliminar Cuenta',
        deleteDesc: 'Eliminación permanente de perfil, repeticiones y trofeos.',
        deleteBtn: 'Eliminar cuenta permanentemente',
        deleteModalTitle: 'Confirmar eliminación de cuenta',
        deleteModalWarning: 'Esta acción es irreversible. Todos tus datos se borrarán para siempre.',
        deleteModalPrompt: 'Escribe tu nombre de usuario para confirmar',
        deleteModalPlaceholder: 'Introduce tu username'
      }
    },
    workout: {
      startWorkout: 'Iniciar Entrenamiento',
      cameraSetup: 'Configuración de Cámara',
      allowCamera: 'Permite el acceso a la cámara para el seguimiento de postura',
      calibration: 'Calibración de Posición',
      stepBack: 'Paso atrás hasta que todo tu cuerpo esté en el encuadre',
      getReady: '¡Prepárate!',
      repCount: 'Válidas',
      rejectedReps: 'Rechazadas',
      formFeedback: 'Análisis de Técnica',
      accuracy: 'Precisión',
      finishWorkout: 'Terminar Entrenamiento',
      pressEscToExit: 'Presiona Esc para salir',
      resultTitle: 'Resumen del Entrenamiento',
      xpEarned: 'XP Ganado',
      proofOfWorkout: 'Certificado Proof-of-Workout',
      livenessPassed: 'Prueba de presencia viva superada'
    },
    battle: {
      title: 'Arena de Batalla 1v1',
      subtitle: 'Competición en tiempo real con visión artificial',
      findOpponent: 'Buscar Oponente',
      matchmaking: 'Buscando oponente...',
      ready: '¡Listo!',
      winner: 'Ganador',
      draw: 'Empate',
      aiSparring: 'Bot de Sparring IA (Demo)',
      aiSparringNotice: 'Modo demo. Los puntos de liga solo se obtienen contra atletas reales.'
    },
    leaderboard: {
      title: 'Liga Global de la Forja',
      subtitle: 'Clasificación verificada de los atletas más fuertes',
      rank: 'Puesto',
      athlete: 'Atleta',
      verifiedVolume: 'Volumen verificado',
      battlesWon: 'Duelos ganados',
      weekly: 'Esta semana',
      monthly: 'Este mes',
      allTime: 'Histórico'
    }
  },

  fr: {
    common: {
      appName: 'ForgeMuscle',
      tagline: 'Calisthénie & Forge de Fer',
      loading: 'Chargement...',
      save: 'Enregistrer les modifications',
      saved: 'Enregistré',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      search: 'Rechercher...',
      filter: 'Filtre',
      all: 'Tous',
      verified: 'Vérifié',
      disputed: 'Contesté',
      rejected: 'Rejeté',
      cameraVerified: 'Camera Verified',
      aiSimulator: 'Simulateur IA (Démo)',
      demoNotice: 'Mode démonstration : aucune progression ni récompense',
      level: 'Niveau',
      xp: 'XP',
      reps: 'répétitions',
      streak: 'Jours consécutifs',
      error: 'Erreur',
      success: 'Succès',
      copy: 'Copier',
      copied: 'Copié !',
      comingSoon: 'Bientôt disponible'
    },
    nav: {
      home: 'Accueil',
      exercises: 'Catalogue d\'exercices',
      workout: 'Entraînement Caméra',
      battle: 'Arène de Duel',
      leaderboard: 'Classement',
      passport: 'Passeport Solana',
      profile: 'Mon Profil',
      settings: 'Paramètres',
      wardrobe: 'Garde-robe de Skins',
      community: 'Communauté',
      help: 'Aide',
      logout: 'Déconnexion'
    },
    settings: {
      title: '# Paramètres du Compte',
      subtitle: 'Contrôle complet du profil d\'athlète, sécurité, langue, thème et portefeuille Web3',
      saveChanges: 'Enregistrer',
      savedInCloud: 'Enregistré dans le cloud !',
      saving: 'Enregistrement...',
      tabs: {
        profile: 'Profil',
        profileDesc: 'Avatar, nom, bio, discipline',
        appearance: 'Apparence & Langue',
        appearanceDesc: 'Langue d\'interface, thème forge',
        email: 'Email',
        emailDesc: 'Adresse liée, vérification',
        security: 'Sécurité',
        securityDesc: 'Mot de passe scrypt, sessions actives',
        privacy: 'Confidentialité',
        privacyDesc: 'Visibilité du profil et statistiques',
        wallet: 'Solana Web3',
        walletDesc: 'Portefeuille Phantom / Solflare',
        notifications: 'Notifications',
        notificationsDesc: 'Duels, séances, trophées',
        account: 'Compte',
        accountDesc: 'ID, statut, zone de danger'
      },
      avatar: {
        title: 'Avatar d\'athlète',
        googlePhoto: 'Photo Google',
        chooseStyle: 'Choisissez le style de forge :',
        uploadBtn: 'Télécharger une photo depuis un fichier',
        urlPlaceholder: 'Ou collez l\'URL de l\'image...',
        cropTitle: 'Ajuster et rogner l\'avatar',
        zoom: 'Zoom',
        applyCrop: 'Appliquer l\'avatar',
        removeAvatar: 'Supprimer l\'avatar',
        resetConfirm: 'Avatar réinitialisé à l\'emblème par défaut.',
        errFormat: 'Seuls les formats PNG, JPG, JPEG ou WEBP sont supportés.',
        errSize: 'Le fichier dépasse 3 Mo.',
        errLoad: 'Impossible de charger l\'image.'
      },
      profileForm: {
        username: 'Nom d\'utilisateur (Username)',
        usernameHelp: 'Lettres latines, chiffres et _',
        displayName: 'Nom affiché',
        displayNameHelp: 'Affiché lors des duels 1v1 et sur le classement.',
        discipline: 'Discipline',
        bio: 'Biographie de l\'athlète',
        bioPlaceholder: 'Partagez vos objectifs et votre parcours sportif...'
      },
      appearance: {
        title: 'Langue & Apparence de l\'Interface',
        subtitle: 'Choisissez votre langue et le thème de couleur ForgeMuscle',
        langTitle: 'Langue de l\'interface (Language)',
        langAutoNotice: 'La langue est détectée automatiquement ou choisie manuellement.',
        themeTitle: 'Thème de la Forge (Theme)',
        themeDark: 'Dark Forge (Forge Sombre)',
        themeDarkDesc: 'Métal sombre avec accents néon ambrés',
        themeLight: 'Light Steel (Acier Clair)',
        themeLightDesc: 'Interface en acier haute visibilité pour la lumière du jour',
        themeSystem: 'Système (Par défaut)',
        themeSystemDesc: 'Suit automatiquement les réglages de votre système'
      },
      security: {
        title: 'Sécurité & Sessions Actives',
        subtitle: 'Chiffrement scrypt et gestion des appareils connectés',
        changePass: 'Changer de mot de passe',
        showPass: 'Afficher',
        hidePass: 'Masquer',
        currentPass: 'Mot de passe actuel',
        newPass: 'Nouveau mot de passe (min 6)',
        confirmPass: 'Confirmer le mot de passe',
        updatePassBtn: 'Mettre à jour le mot de passe',
        sessionsTitle: 'Sessions actives',
        logoutAll: 'Déconnecter tous les autres appareils',
        currentDevice: 'Appareil actuel',
        revoke: 'Révoquer'
      },
      privacy: {
        title: 'Confidentialité & Visibilité',
        subtitle: 'Contrôle de visibilité du profil et des statistiques',
        profileVis: 'Visibilité du profil',
        visPublic: 'Public (Visible par tous les athlètes)',
        visFriends: 'Amis et guilde uniquement',
        visPrivate: 'Privé (Masqué des classements mondiaux)',
        showStats: 'Afficher les statistiques au classement',
        showBattleStats: 'Afficher les victoires en arène',
        showAchievements: 'Rendre les trophées publics',
        onlineStatus: 'Afficher le statut en ligne pour les défis'
      },
      wallet: {
        title: 'Portefeuille Solana Web3',
        subtitle: 'Connectez votre portefeuille pour le Proof-of-Workout on-chain',
        connected: 'Portefeuille connecté',
        notConnected: 'Portefeuille non connecté',
        address: 'Clé publique :',
        network: 'Réseau Solana :',
        connectBtn: 'Connecter Phantom / Solflare',
        disconnectBtn: 'Déconnecter le portefeuille',
        viewExplorer: 'Voir sur Solana Explorer',
        securityNote: 'Les clés privées ne quittent jamais votre navigateur.'
      },
      notifications: {
        title: 'Notifications',
        subtitle: 'Alertes pour les duels, entraînements et trophées',
        workoutReminders: 'Rappels d\'entraînement quotidiens',
        battleAlerts: 'Défis de duels 1v1 entrants',
        achievements: 'Nouveaux trophées débloqués',
        community: 'Réponses et commentaires dans la communauté',
        guild: 'Événements et raids de guilde',
        systemUpdates: 'Mises à jour et nouveaux exercices vérifiés'
      },
      account: {
        title: 'Gestion du Compte',
        subtitle: 'Identifiant d\'athlète, statut et zone de danger',
        accountId: 'ID du compte :',
        createdAt: 'Date d\'inscription :',
        role: 'Rôle :',
        logoutTitle: 'Déconnexion',
        logoutDesc: 'Terminer la session en cours sur cet appareil.',
        logoutBtn: 'Se déconnecter',
        dangerZone: 'Zone de Danger',
        deleteTitle: 'Supprimer le compte',
        deleteDesc: 'Suppression irréversible du profil, des répétitions et des trophées.',
        deleteBtn: 'Supprimer définitivement le compte',
        deleteModalTitle: 'Confirmer la suppression du compte',
        deleteModalWarning: 'Cette action est définitive et irréversible.',
        deleteModalPrompt: 'Tapez votre nom d\'utilisateur pour confirmer',
        deleteModalPlaceholder: 'Entrez votre username'
      }
    },
    workout: {
      startWorkout: 'Commencer l\'entraînement',
      cameraSetup: 'Configuration de la caméra',
      allowCamera: 'Veuillez autoriser la caméra pour le suivi postural',
      calibration: 'Calibrage de la position',
      stepBack: 'Reculez pour que tout votre corps soit visible',
      getReady: 'Préparez-vous !',
      repCount: 'Validées',
      rejectedReps: 'Rejetées',
      formFeedback: 'Analyse de posture',
      accuracy: 'Précision',
      finishWorkout: 'Terminer la séance',
      pressEscToExit: 'Appuyez sur Échap pour quitter',
      resultTitle: 'Résumé de l\'entraînement',
      xpEarned: 'XP Gagné',
      proofOfWorkout: 'Certificat Proof-of-Workout',
      livenessPassed: 'Vérification de présence physique validée'
    },
    battle: {
      title: 'Arène de Duel 1v1',
      subtitle: 'Compétition en temps réel avec vision par ordinateur',
      findOpponent: 'Trouver un adversaire',
      matchmaking: 'Recherche d\'adversaire...',
      ready: 'Prêt !',
      winner: 'Vainqueur',
      draw: 'Égalité',
      aiSparring: 'Bot de Sparring IA (Démo)',
      aiSparringNotice: 'Mode démo. Les points de ligue sont attribués uniquement contre de vrais athlètes.'
    },
    leaderboard: {
      title: 'Ligue Mondiale de la Forge',
      subtitle: 'Classement vérifié des athlètes les plus forts',
      rank: 'Rang',
      athlete: 'Athlète',
      verifiedVolume: 'Volume vérifié',
      battlesWon: 'Duels gagnés',
      weekly: 'Cette semaine',
      monthly: 'Ce mois-ci',
      allTime: 'Tout temps'
    }
  }
};

class I18nService {
  private currentLang: SupportedLanguage = 'uk';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    if (typeof window === 'undefined') return;

    // 1. Check localStorage
    const saved = localStorage.getItem('forgemuscle_language') as SupportedLanguage;
    if (saved && translations[saved]) {
      this.currentLang = saved;
      this.updateHtmlLang(saved);
      return;
    }

    // 2. Check navigator.language
    const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
    if (browserLang.startsWith('uk') || browserLang.startsWith('ua')) {
      this.currentLang = 'uk';
    } else if (browserLang.startsWith('pl')) {
      this.currentLang = 'pl';
    } else if (browserLang.startsWith('de')) {
      this.currentLang = 'de';
    } else if (browserLang.startsWith('es')) {
      this.currentLang = 'es';
    } else if (browserLang.startsWith('fr')) {
      this.currentLang = 'fr';
    } else {
      this.currentLang = 'en';
    }

    this.updateHtmlLang(this.currentLang);
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  public setLanguage(lang: SupportedLanguage) {
    if (!translations[lang]) return;
    this.currentLang = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('forgemuscle_language', lang);
      this.updateHtmlLang(lang);
    }
    this.notify();
  }

  private updateHtmlLang(lang: string) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  /**
   * Translate key path e.g. "settings.title" or "common.save"
   */
  public t(path: string, fallback?: string): string {
    const keys = path.split('.');
    let current: any = translations[this.currentLang];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let enCurrent: any = translations.en;
        for (const enKey of keys) {
          if (enCurrent && typeof enCurrent === 'object' && enKey in enCurrent) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || path;
          }
        }
        return typeof enCurrent === 'string' ? enCurrent : (fallback || path);
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  }

  /**
   * Locale-aware pluralization
   */
  public plural(count: number, forms: { one: string; few?: string; many?: string; other: string }): string {
    const lang = this.currentLang;

    if (lang === 'uk' || lang === 'pl') {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod10 === 1 && mod100 !== 11) {
        return `${count} ${forms.one}`;
      }
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return `${count} ${forms.few || forms.other}`;
      }
      return `${count} ${forms.many || forms.other}`;
    }

    if (count === 1) {
      return `${count} ${forms.one}`;
    }
    return `${count} ${forms.other}`;
  }

  /**
   * Formatting helpers using Intl API
   */
  public formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const d = new Date(date);
    const locale = this.getLocaleCode();
    return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(d);
  }

  public formatTime(date: Date | string | number): string {
    const d = new Date(date);
    const locale = this.getLocaleCode();
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);
  }

  public formatNumber(num: number): string {
    const locale = this.getLocaleCode();
    return new Intl.NumberFormat(locale).format(num);
  }

  public formatPercent(val: number): string {
    const locale = this.getLocaleCode();
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(val);
  }

  public getLocaleCode(): string {
    switch (this.currentLang) {
      case 'uk': return 'uk-UA';
      case 'pl': return 'pl-PL';
      case 'de': return 'de-DE';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      default: return 'en-US';
    }
  }
}

export const i18n = new I18nService();
