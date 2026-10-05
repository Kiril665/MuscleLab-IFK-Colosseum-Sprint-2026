import { SupportedLocale, detectBrowserLocale, saveUserLocale } from '../config/locales';
import { authStore } from './authStore';

export interface TranslationsDict {
  nav: {
    home: string;
    battle: string;
    chat: string;
    leaderboard: string;
    profile: string;
    settings: string;
  };
  auth: {
    checkingSession: string;
    title: string;
    subtitle: string;
    loginTab: string;
    registerTab: string;
    forgotTab: string;
    emailLabel: string;
    passwordLabel: string;
    nickLabel: string;
    loginBtn: string;
    registerBtn: string;
    forgotBtn: string;
    guestBtn: string;
    orDivider: string;
    forgotLink: string;
    backToLogin: string;
    resetSuccessMsg: string;
    termsNotice: string;
    duplicateNick: string;
    invalidCredentials: string;
    shortPassword: string;
  };
  onboarding: {
    stepOf: string;
    next: string;
    prev: string;
    skip: string;
    finish: string;
    restartBtn: string;
    welcomeTitle: string;
    welcomeDesc: string;
    homeTitle: string;
    homeDesc: string;
    battleTitle: string;
    battleDesc: string;
    chatTitle: string;
    chatDesc: string;
    leaderboardTitle: string;
    leaderboardDesc: string;
    profileTitle: string;
    profileDesc: string;
    settingsTitle: string;
    settingsDesc: string;
    permissionsTitle: string;
    permissionsDesc: string;
    allowCamera: string;
    allowMic: string;
    cameraAllowed: string;
    micAllowed: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    startBasics: string;
    stepIndicator: string;
    of: string;
    readyCta: string;
    quizButton: string;
    changeGoal: string;
    firstQuests: string;
    completed: string;
    readNotes: string;
    detailedTech: string;
    inBattle: string;
    readyChallenge: string;
    firstBattleSub: string;
  };
  battle: {
    title: string;
    subtitle: string;
    modePvp: string;
    modeCompetition: string;
    competitionTitle: string;
    competitionSubtitle: string;
    competitionJoin: string;
    competitionParticipants: string;
    competitionScore: string;
    competitionFinish: string;
    competitionRule: string;
    calibration: string;
    callFriend: string;
    startCalibration: string;
    allReadySearch: string;
    searchingOpponent: string;
    timeoutTitle: string;
    timeoutDesc: string;
    sparWithBot: string;
    retrySearch: string;
    cancelSearch: string;
    yourReps: string;
    accuracy: string;
    manualRep: string;
    victory: string;
    defeat: string;
    draw: string;
    rematch: string;
    share: string;
    copied: string;
    endDuel: string;
    viewRankings: string;
    thresholdRom: string;
    chatTitle: string;
    voiceTitle: string;
    challengeBanner: string;
    challengeGotIt: string;
    preCheckTitle: string;
    preCheckDesc: string;
    bodyInFrame: string;
    bodyOutOfFrame: string;
    stepBack: string;
    warmupTitle: string;
    warmupDesc: string;
    warmupReady: string;
    noCameraMode: string;
    manualRepsNotice: string;
    onAirCamera: string;
    onAirMic: string;
  };
  chat: {
    community: string;
    sub: string;
    chatTab: string;
    voiceTab: string;
    listTab: string;
    online: string;
    sendPlaceholder: string;
    joinRoom: string;
    leaveRoom: string;
    micOn: string;
    micOff: string;
    connectedTo: string;
    duelAction: string;
    speaking: string;
    reportMsg: string;
    reportSent: string;
    blockUser: string;
    blockedSent: string;
    profanityWarning: string;
    pttHold: string;
    pttRelease: string;
  };
  profile: {
    streak: string;
    totalXp: string;
    walletTitle: string;
    walletDesc: string;
    walletConnect: string;
    walletGuest: string;
    coins: string;
    wins: string;
    winrate: string;
    reps: string;
    questsTab: string;
    titlesTab: string;
    statsTab: string;
    claimReward: string;
    inProgress: string;
    claimed: string;
    selectTitle: string;
    activeTitle: string;
    repsByExercise: string;
  };
  settings: {
    title: string;
    tabMic: string;
    tabCamera: string;
    tabAccount: string;
    tabGeneral: string;
    micToggle: string;
    micDevice: string;
    testMic: string;
    testingMic: string;
    micLevel: string;
    pttToggle: string;
    pttDesc: string;
    permGranted: string;
    permDenied: string;
    permPrompt: string;
    permDeniedGuide: string;
    cameraToggle: string;
    cameraDevice: string;
    testCamera: string;
    frontCamera: string;
    backCamera: string;
    showSkeleton: string;
    mirrorVideo: string;
    previewTitle: string;
    accountInfo: string;
    registeredAt: string;
    editNickAvatar: string;
    changePassword: string;
    curPass: string;
    newPass: string;
    savePass: string;
    activeSessions: string;
    exportData: string;
    deleteData: string;
    deleteDataConfirm: string;
    logoutBtn: string;
    logoutAllBtn: string;
    deleteAccBtn: string;
    modalLogoutTitle: string;
    modalLogoutDesc: string;
    guestLogoutDesc: string;
    modalStay: string;
    modalConfirmLogout: string;
    modalDeleteTitle: string;
    modalDeleteDesc: string;
    modalTypeDelete: string;
    modalConfirmDelete: string;
    language: string;
    theme: string;
    dark: string;
    light: string;
    sounds: string;
    haptics: string;
    notifications: string;
    privacy: string;
    public: string;
    friendsOnly: string;
    restartTour: string;
    aboutApp: string;
    version: string;
    installPwa: string;
    pwaInstalled: string;
  };
  offline: {
    title: string;
    desc: string;
    retry: string;
  };
  common: {
    xp: string;
    level: string;
    step: string;
    coins: string;
    cancel: string;
    confirm: string;
    close: string;
    save: string;
    success: string;
    error: string;
  };
}

export const translations: Record<SupportedLocale, TranslationsDict> = {
  uk: {
    nav: {
      home: 'Головна',
      battle: 'Battle',
      chat: 'Чат / Voice',
      leaderboard: 'Рейтинг',
      profile: 'Профіль',
      settings: 'Налаштування'
    },
    auth: {
      checkingSession: 'Перевірка сесії атлета...',
      title: 'Кузня Твого Тіла',
      subtitle: 'Увійдіть або зареєструйтеся, щоб продовжити тренування',
      loginTab: 'Вхід',
      registerTab: 'Реєстрація',
      forgotTab: 'Відновлення',
      emailLabel: 'Email адреса',
      passwordLabel: 'Пароль',
      nickLabel: 'Нікнейм атлета',
      loginBtn: 'Увійти в акаунт',
      registerBtn: 'Створити акаунт',
      forgotBtn: 'Надіслати інструкцію',
    guestBtn: 'Увійти як гість',
      orDivider: 'або через email',
      forgotLink: 'Забули пароль?',
      backToLogin: 'Повернутися до входу',
      resetSuccessMsg: 'Інструкції зі скидання пароля надіслано!',
      termsNotice: 'Реєструючись, ви погоджуєтеся з чесними правилами змагань ForgeMuscle.',
      duplicateNick: 'Цей нікнейм уже використовується іншим атлетом.',
      invalidCredentials: 'Невірний email або пароль.',
      shortPassword: 'Пароль має містити щонайменше 8 символів.',
    },
    onboarding: {
      stepOf: 'Крок {step} з {total}',
      next: 'Далі',
      prev: 'Назад',
      skip: 'Пропустити',
      finish: 'Завершити',
      restartBtn: 'Пройти навчання знову',
      welcomeTitle: 'Ласкаво просимо до ForgeMuscle! 🔥',
      welcomeDesc: 'Твоя персональна фітнес-платформа для тренувань, де комп’ютерний зір допомагає тримати бездоганну форму та перемагати у чесних дуелях.',
      homeTitle: 'База знань та квести 📖',
      homeDesc: 'Тут ти дізнаєшся основи анатомії, правильну біомеханіку та техніку дихання без шкідливих міфів, а також виконаєш перші квести.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: '60-секундні дуелі з іншими атлетами або Босом-Скелетом! ШІ-камера відстежує глибину та чистоту кожного повтору (ROM > 85%).',
      chatTitle: 'Forge Chat & Голосові кімнати 🎙️',
      chatDesc: 'Спілкуйся з однодумцями, знаходь спаринг-партнерів та обговорюй техніку в режимі реального часу.',
      leaderboardTitle: 'Таблиця Лідерів 🏆',
      leaderboardDesc: 'Змагайся за вершину рейтингу атлетів, кидай прямі виклики та збирай титули заліку.',
      profileTitle: 'Твій Профіль Атлета ⚡',
      profileDesc: 'Відстежуй рівень (LVL), отримані титули, історію повторів та персональну статистику перемог.',
      settingsTitle: 'Налаштування пристроїв ⚙️',
      settingsDesc: 'Керуй камерою, мікрофоном (включно з Push-to-Talk), мовою, темою та конфіденційністю акаунта.',
      permissionsTitle: 'Дозволи камери та мікрофона 🎥',
      permissionsDesc: 'Камера необхідна для підрахунку повторів через нейромережу, а мікрофон — для голосового зв’язку під час дуелей.',
      allowCamera: 'Дозволити камеру',
      allowMic: 'Дозволити мікрофон',
      cameraAllowed: 'Камеру дозволено ✅',
      micAllowed: 'Мікрофон дозволено ✅'
    },
    home: {
      heroTitle: 'Кузня Твого Тіла',
      heroSubtitle: 'Без води та шкідливих міфів. Дізнайся базу гіпертрофії, постав чисту техніку перед ШІ-камерою та перемагай у 60-секундних дуелях.',
      startBasics: 'Почати з основ',
      stepIndicator: 'Шлях новачка: Крок',
      of: 'з',
      readyCta: 'Готовий? Перший Battle',
      quizButton: 'Пройти тест рівня (30 сек)',
      changeGoal: 'Змінити ціль тесту',
      firstQuests: 'Твої перші квести',
      completed: 'виконано',
      readNotes: 'Читати конспект',
      detailedTech: 'Детальна техніка',
      inBattle: 'В Battle',
      readyChallenge: 'Готовий до випробування?',
      firstBattleSub: 'ШІ-камера верифікує кути суглобів понад 85% ROM. Покажи свою форму!'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: '60-секундні дуелі та асинхронні змагання перед розумною камерою',
      modePvp: 'Дуель 1v1 (PvP)',
      modeCompetition: 'Змагання',
      competitionTitle: 'Змагання на повтори',
      competitionSubtitle: 'Покажи найкращий результат за 60 секунд',
      competitionFinish: 'Завершити спробу',
      competitionRule: 'Зараховується найкраща спроба за 60 секунд.',
      competitionScore: 'Результат',
      competitionParticipants: 'учасників',
      competitionJoin: 'Взяти участь',
      calibration: 'Калібрування камери',
      callFriend: 'Викликати друга',
      startCalibration: 'Перейти до калібрування',
      allReadySearch: 'Все готово! Пошук суперника',
      searchingOpponent: 'Шукаємо живого суперника...',
      timeoutTitle: 'Суперника наразі не знайдено',
      timeoutDesc: 'Всі атлети зайняті. Ти можеш провести тренувальний спаринг із ботом або спробувати знову.',
      sparWithBot: 'Спаринг із ботом «Залізний Тарас»',
      retrySearch: 'Повторити пошук',
      cancelSearch: 'Скасувати пошук',
      yourReps: 'Твої повтори',
      accuracy: 'Точність',
      manualRep: '+ Зарахувати повтор вручну (сенсор)',
      victory: 'ПЕРЕМОГА!',
      defeat: 'ДОСТОЙНИЙ БІЙ',
      draw: 'БОЙОВА НІЧИЯ!',
      rematch: 'Реванш',
      share: 'Поділитися',
      copied: 'Скопійовано!',
      endDuel: 'Завершити дуель',
      viewRankings: 'До рейтингу',
      thresholdRom: 'Поріг амплітуди 85% ROM',
      chatTitle: 'Чат бою',
      voiceTitle: 'Голосовий зв’язок',
      challengeBanner: 'Тебе викликали на 60-секундну дуель у Forge Battle! Прийми виклик.',
      challengeGotIt: 'Зрозуміло',
      preCheckTitle: 'Перевірка ракурсу перед боєм',
      preCheckDesc: 'Постав телефон або камеру так, щоб було видно все тіло для точного підрахунку.',
      bodyInFrame: 'Тіло повністю у кадрі ✅',
      bodyOutOfFrame: 'Відійди назад — видно не всі суглоби',
      stepBack: 'Зроби 2 кроки назад від камери',
      warmupTitle: 'Розминка та техніка безпеки ⚠️',
      warmupDesc: 'Перед інтенсивним сетом зроби 10 обертань плечима та розігрій зап’ястя.',
      warmupReady: 'Я розім’явся, починаємо!',
      noCameraMode: 'Режим без камери (Ручний підрахунок)',
      manualRepsNotice: 'Камера вимкнена або недоступна. Рахуйте повтори кнопкою або пробілом.',
      onAirCamera: 'КАМЕРА В ЕФІРІ',
      onAirMic: 'МІКРОФОН АКТИВНИЙ'
    },
    chat: {
      community: 'Спільнота Forge',
      sub: 'Текстові канали та живий голосовий зв’язок з атлетами',
      chatTab: 'Текстовий чат',
      voiceTab: 'Голосові кімнати',
      listTab: 'Список атлетів',
      online: 'В мережі',
      sendPlaceholder: 'Напиши повідомлення...',
      joinRoom: 'Увійти в кімнату',
      leaveRoom: 'Покинути кімнату',
      micOn: 'Мікрофон увімкнено',
      micOff: 'Мікрофон вимкнено',
      connectedTo: 'Підключено до',
      duelAction: 'Викликати на дуель',
      speaking: 'Говорить...',
      reportMsg: 'Поскаржитись',
      reportSent: 'Скаргу надіслано модераторам',
      blockUser: 'Заблокувати',
      blockedSent: 'Користувача заблоковано',
      profanityWarning: 'Повідомлення містить нецензурну лексику та було приховано.',
      pttHold: 'Утримуй [ПРОБІЛ], щоб говорити',
      pttRelease: 'Відпусти, щоб вимкнути мікрофон'
    },
    profile: {
      streak: 'Днів серії',
      totalXp: 'Загальний досвід',
      walletTitle: 'Solana-гаманець',
      walletDesc: 'Прив’яжи гаманець лише для підтвердження особи та перегляду балансу.',
      walletConnect: 'Підключити гаманець',
      walletGuest: 'Створи акаунт, щоб підключити Solana-гаманець.',      coins: 'Бали заліза',
      wins: 'Перемог',
      winrate: 'Вінрейт',
      reps: 'Повторів',
      questsTab: 'Квести',
      titlesTab: 'Титули',
      statsTab: 'Статистика',
      claimReward: 'Забрати нагороду',
      inProgress: 'У процесі',
      claimed: 'Отримано',
      selectTitle: 'Обрати активний титул',
      activeTitle: 'Активний титул',
      repsByExercise: 'Повтори за вправами'
    },
    settings: {
      title: 'Налаштування Forge',
      tabMic: 'Мікрофон',
      tabCamera: 'Відео / Камера',
      tabAccount: 'Акаунт',
      tabGeneral: 'Загальні',
      micToggle: 'Мікрофон увімкнено',
      micDevice: 'Пристрій введення звуку',
      testMic: 'Перевірити мікрофон',
      testingMic: 'Говоріть у мікрофон...',
      micLevel: 'Рівень вхідного сигналу',
      pttToggle: 'Режим Push-to-talk (говорити по утриманню)',
      pttDesc: 'Мікрофон передаватиме звук лише коли ви затискаєте клавішу або кнопку.',
      permGranted: 'Дозвіл надано ✅',
      permDenied: 'Дозвіл заблоковано ❌',
      permPrompt: 'Потрібен дозвіл',
      permDeniedGuide: 'Щоб увімкнути, натисніть на іконку замка в адресному рядку браузера та дозволіть доступ.',
      cameraToggle: 'Камера увімкнена',
      cameraDevice: 'Вибір камери',
      testCamera: 'Перевірити камеру',
      frontCamera: 'Фронтальна камера',
      backCamera: 'Тильна (основна) камера',
      showSkeleton: 'Показувати скелет (позначки тіла)',
      mirrorVideo: 'Дзеркальне відображення',
      previewTitle: 'Попередній перегляд відео',
      accountInfo: 'Інформація про акаунт',
      registeredAt: 'Дата реєстрації',
      editNickAvatar: 'Редагувати нікнейм та аватар',
      changePassword: 'Зміна пароля',
      curPass: 'Поточний пароль',
      newPass: 'Новий пароль',
      savePass: 'Зберегти новий пароль',
      activeSessions: 'Активні сесії на пристроях',
      exportData: 'Експортувати мої дані (JSON)',
      deleteData: 'Очистити історію тренувань',
      deleteDataConfirm: 'Ви дійсно бажаєте скинути історію повторів та XP? Акаунт збережеться.',
      logoutBtn: 'Вийти з акаунта',
      logoutAllBtn: 'Вийти на всіх пристроях',
      deleteAccBtn: 'Видалити акаунт назавжди',
      modalLogoutTitle: 'Вихід з ForgeMuscle',
      modalLogoutDesc: 'Ви впевнені, що бажаєте вийти зі свого акаунта?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Залишитись',
      modalConfirmLogout: 'Вийти',
      modalDeleteTitle: 'Видалення акаунта',
      modalDeleteDesc: 'Ця дія незворотна. Усі ваші досягнення, статистика дуелей та історія будуть стерті.',
      modalTypeDelete: 'Введіть слово ВИДАЛИТИ для підтвердження:',
      modalConfirmDelete: 'Видалити назавжди',
      language: 'Мова застосунку',
      theme: 'Тема інтерфейсу',
      dark: 'Темна (Forge Ember)',
      light: 'Світла',
      sounds: 'Звукові ефекти та відлік',
      haptics: 'Тактильний відгук (вібрація)',
      notifications: 'Сповіщення про виклики',
      privacy: 'Приватність профілю',
      public: 'Публічний',
      friendsOnly: 'Тільки для друзів',
      restartTour: 'Пройти інтерактивне навчання знову',
      aboutApp: 'Про застосунок',
      version: 'Версія ForgeMuscle 2.0.0',
      installPwa: 'Встановити як додаток (PWA)',
      pwaInstalled: 'Додаток вже встановлено'
    },
    offline: {
      title: 'Немає з’єднання з мережею',
      desc: 'ForgeMuscle працює в автономному режимі. Перевірте підключення до інтернету.',
      retry: 'Спробувати знову'
    },
    common: {
      xp: 'XP',
      level: 'Рівень',
      step: 'Крок',
      coins: 'бали',
      cancel: 'Скасувати',
      confirm: 'Підтвердити',
      close: 'Закрити',
      save: 'Зберегти',
      success: 'Успішно!',
      error: 'Помилка'
    }
  },
  en: {
    nav: {
      home: 'Home',
      battle: 'Battle',
      chat: 'Chat / Voice',
      leaderboard: 'Rankings',
      profile: 'Profile',
      settings: 'Settings'
    },
    auth: {
      checkingSession: 'Checking athlete session...',
      title: 'The Forge of Your Body',
      subtitle: 'Sign in or create an account to start training',
      loginTab: 'Sign In',
      registerTab: 'Register',
      forgotTab: 'Reset',
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      nickLabel: 'Athlete Nickname',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      forgotBtn: 'Send Instructions',
    guestBtn: 'Continue as guest',
      orDivider: 'or with email',
      forgotLink: 'Forgot password?',
      backToLogin: 'Back to Sign In',
      resetSuccessMsg: 'Password reset instructions have been sent!',
      termsNotice: 'By continuing, you agree to fair competition rules of ForgeMuscle.',
      duplicateNick: 'This nickname is already taken.',
      invalidCredentials: 'Invalid email or password.',
      shortPassword: 'Password must be at least 8 characters.',
    },
    onboarding: {
      stepOf: 'Step {step} of {total}',
      next: 'Next',
      prev: 'Back',
      skip: 'Skip',
      finish: 'Finish',
      restartBtn: 'Restart Onboarding',
      welcomeTitle: 'Welcome to ForgeMuscle! 🔥',
      welcomeDesc: 'Your personal fitness platform where computer vision ensures strict form and authentic 60-second duels.',
      homeTitle: 'Knowledge Base & Quests 📖',
      homeDesc: 'Master hypertrophy principles, biomechanics, and breathing, plus complete your starter quests.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: '60-second duels and asynchronous competitions with AI vision tracking over 85% ROM.',
      chatTitle: 'Forge Chat & Live Voice 🎙️',
      chatDesc: 'Connect with peers, find sparring partners, and discuss training technique in real time.',
      leaderboardTitle: 'Athlete Leaderboard 🏆',
      leaderboardDesc: 'Compete for the top rankings, send direct duel invites, and earn prestige titles.',
      profileTitle: 'Your Athlete Profile ⚡',
      profileDesc: 'Track your level, unlocked titles, total rep milestones, and duel winrate.',
      settingsTitle: 'Device Settings ⚙️',
      settingsDesc: 'Configure camera, microphone (including Push-to-Talk), language, theme, and privacy.',
      permissionsTitle: 'Camera & Mic Permissions 🎥',
      permissionsDesc: 'Camera is required for AI rep verification, and microphone is needed for real-time duel voice.',
      allowCamera: 'Allow Camera',
      allowMic: 'Allow Microphone',
      cameraAllowed: 'Camera Allowed ✅',
      micAllowed: 'Microphone Allowed ✅'
    },
    home: {
      heroTitle: 'The Forge of Your Body',
      heroSubtitle: 'No fluff, no myths. Master hypertrophy basics, refine technique in front of AI vision, and win 60-second duels.',
      startBasics: 'Start with Basics',
      stepIndicator: 'Novice Path: Step',
      of: 'of',
      readyCta: 'Ready? First Battle',
      quizButton: 'Take Level Quiz (30s)',
      changeGoal: 'Change Quiz Goal',
      firstQuests: 'Your First Quests',
      completed: 'completed',
      readNotes: 'Read Summary',
      detailedTech: 'Detailed Technique',
      inBattle: 'To Battle',
      readyChallenge: 'Ready for Challenge?',
      firstBattleSub: 'AI camera verifies joint angles with >85% ROM. Show your strength!'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: '60-second duels and asynchronous competitions with smart camera tracking',
      modePvp: '1v1 Duel (PvP)',
      modeCompetition: 'Competition',
      competitionTitle: 'Repetition Competition',
      competitionSubtitle: 'Set your best score in 60 seconds',
      competitionFinish: 'Finish attempt',
      competitionRule: 'Your best 60-second attempt counts.',
      competitionScore: 'Score',
      competitionParticipants: 'participants',
      competitionJoin: 'Join',
      calibration: 'Camera Calibration',
      callFriend: 'Invite a Friend',
      startCalibration: 'Proceed to Calibration',
      allReadySearch: 'Ready! Find Opponent',
      searchingOpponent: 'Searching for an athlete...',
      timeoutTitle: 'No Opponent Found Yet',
      timeoutDesc: 'All athletes are busy. You can spar against Bot Taras or search again.',
      sparWithBot: 'Spar with Bot Taras',
      retrySearch: 'Retry Search',
      cancelSearch: 'Cancel Search',
      yourReps: 'Your Reps',
      accuracy: 'Accuracy',
      manualRep: '+ Count Rep Manually (Sensor)',
      victory: 'VICTORY!',
      defeat: 'HONORABLE FIGHT',
      draw: 'DRAW!',
      rematch: 'Rematch',
      share: 'Share',
      copied: 'Copied!',
      endDuel: 'End Duel',
      viewRankings: 'View Rankings',
      thresholdRom: '85% ROM Amplitude Threshold',
      chatTitle: 'Battle Chat',
      voiceTitle: 'Voice Comms',
      challengeBanner: 'You have been challenged to a 60-second duel in Forge Battle!',
      challengeGotIt: 'Got it',
      preCheckTitle: 'Pre-Battle Camera Check',
      preCheckDesc: 'Position your device so your full body is visible for accurate AI rep counting.',
      bodyInFrame: 'Full body in frame ✅',
      bodyOutOfFrame: 'Step back — joints not fully visible',
      stepBack: 'Take 2 steps back from camera',
      warmupTitle: 'Warmup & Safety Notice ⚠️',
      warmupDesc: 'Warm up shoulders and wrists before starting your intense 60-second set.',
      warmupReady: 'Warmed up, let’s go!',
      noCameraMode: 'No-Camera Mode (Manual Counting)',
      manualRepsNotice: 'Camera is disabled or unavailable. Count reps via button or Spacebar.',
      onAirCamera: 'CAMERA ON AIR',
      onAirMic: 'MIC ACTIVE'
    },
    chat: {
      community: 'Forge Community',
      sub: 'Text channels and live voice communication',
      chatTab: 'Text Chat',
      voiceTab: 'Voice Rooms',
      listTab: 'Athletes List',
      online: 'Online',
      sendPlaceholder: 'Type a message...',
      joinRoom: 'Join Room',
      leaveRoom: 'Leave Room',
      micOn: 'Mic On',
      micOff: 'Mic Off',
      connectedTo: 'Connected to',
      duelAction: 'Challenge to Duel',
      speaking: 'Speaking...',
      reportMsg: 'Report',
      reportSent: 'Report submitted to moderators',
      blockUser: 'Block User',
      blockedSent: 'User has been blocked',
      profanityWarning: 'Message contained inappropriate language and was filtered.',
      pttHold: 'Hold [SPACE] to talk',
      pttRelease: 'Release to mute mic'
    },
    profile: {
      streak: 'Day Streak',
      totalXp: 'Total Experience',
      walletTitle: 'Solana Wallet',
      walletDesc: 'Link your wallet for identity verification and balance only.',
      walletConnect: 'Connect Wallet',
      walletGuest: 'Create an account to connect a Solana wallet.',      coins: 'Forge Points',
      wins: 'Victories',
      winrate: 'Winrate',
      reps: 'Total Reps',
      questsTab: 'Quests',
      titlesTab: 'Titles',
      statsTab: 'Statistics',
      claimReward: 'Claim Reward',
      inProgress: 'In Progress',
      claimed: 'Claimed',
      selectTitle: 'Set Active Title',
      activeTitle: 'Active Title',
      repsByExercise: 'Reps by Exercise'
    },
    settings: {
      title: 'Forge Settings',
      tabMic: 'Microphone',
      tabCamera: 'Video / Camera',
      tabAccount: 'Account',
      tabGeneral: 'General',
      micToggle: 'Microphone Enabled',
      micDevice: 'Audio Input Device',
      testMic: 'Test Microphone',
      testingMic: 'Speak into microphone...',
      micLevel: 'Input Signal Level',
      pttToggle: 'Push-to-talk Mode',
      pttDesc: 'Microphone transmits audio only when you hold the button/key.',
      permGranted: 'Permission Granted ✅',
      permDenied: 'Permission Blocked ❌',
      permPrompt: 'Permission Required',
      permDeniedGuide: 'To enable, click the lock icon in your browser address bar and allow access.',
      cameraToggle: 'Camera Enabled',
      cameraDevice: 'Camera Device',
      testCamera: 'Test Camera',
      frontCamera: 'Front Camera',
      backCamera: 'Rear Camera',
      showSkeleton: 'Show Skeleton Overlay',
      mirrorVideo: 'Mirror Video Feed',
      previewTitle: 'Video Feed Preview',
      accountInfo: 'Account Information',
      registeredAt: 'Registered Date',
      editNickAvatar: 'Edit Nickname & Avatar',
      changePassword: 'Change Password',
      curPass: 'Current Password',
      newPass: 'New Password',
      savePass: 'Save New Password',
      activeSessions: 'Active Sessions',
      exportData: 'Export My Data (JSON)',
      deleteData: 'Reset Workout History',
      deleteDataConfirm: 'Reset your workout history and XP? Your login account will remain.',
      logoutBtn: 'Sign Out',
      logoutAllBtn: 'Sign Out All Devices',
      deleteAccBtn: 'Delete Account Permanently',
      modalLogoutTitle: 'Sign Out from ForgeMuscle',
      modalLogoutDesc: 'Are you sure you want to sign out of your account?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Stay',
      modalConfirmLogout: 'Sign Out',
      modalDeleteTitle: 'Delete Account Permanently',
      modalDeleteDesc: 'This action is irreversible. All your progress, stats, and records will be deleted.',
      modalTypeDelete: 'Type DELETE to confirm:',
      modalConfirmDelete: 'Delete Permanently',
      language: 'App Language',
      theme: 'Interface Theme',
      dark: 'Dark (Forge Ember)',
      light: 'Light',
      sounds: 'Audio Cues & Countdown',
      haptics: 'Haptic Feedback',
      notifications: 'Duel Notifications',
      privacy: 'Profile Privacy',
      public: 'Public',
      friendsOnly: 'Friends Only',
      restartTour: 'Restart Interactive Tour',
      aboutApp: 'About App',
      version: 'ForgeMuscle v2.0.0',
      installPwa: 'Install as App (PWA)',
      pwaInstalled: 'App is installed'
    },
    offline: {
      title: 'No Internet Connection',
      desc: 'ForgeMuscle is currently operating offline. Check your network.',
      retry: 'Retry'
    },
    common: {
      xp: 'XP',
      level: 'Level',
      step: 'Step',
      coins: 'points',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      success: 'Success!',
      error: 'Error'
    }
  },
  pl: {
    nav: {
      home: 'Główna',
      battle: 'Bitwa',
      chat: 'Czat / Voice',
      leaderboard: 'Ranking',
      profile: 'Profil',
      settings: 'Ustawienia'
    },
    auth: {
      checkingSession: 'Sprawdzanie sesji sportowca...',
      title: 'Kuźnia Twojego Ciała',
      subtitle: 'Zaloguj się lub zarejestruj, aby trenować',
      loginTab: 'Logowanie',
      registerTab: 'Rejestracja',
      forgotTab: 'Odzyskiwanie',
      emailLabel: 'Adres e-mail',
      passwordLabel: 'Hasło',
      nickLabel: 'Pseudonim',
      loginBtn: 'Zaloguj się',
      registerBtn: 'Zarejestruj się',
      forgotBtn: 'Wyślij instrukcję',
    guestBtn: 'Zaloguj jako gość',
      orDivider: 'lub przez e-mail',
      forgotLink: 'Nie pamiętasz hasła?',
      backToLogin: 'Powrót do logowania',
      resetSuccessMsg: 'Wysłano link do zresetowania hasła!',
      termsNotice: 'Rejestrując się, akceptujesz zasady ForgeMuscle.',
      duplicateNick: 'Ten pseudonim jest już zajęty.',
      invalidCredentials: 'Nieprawidłowy e-mail lub hasło.',
      shortPassword: 'Hasło musi mieć co najmniej 8 znaków.',
    },
    onboarding: {
      stepOf: 'Krok {step} z {total}',
      next: 'Dalej',
      prev: 'Wstecz',
      skip: 'Pomiń',
      finish: 'Zakończ',
      restartBtn: 'Powtórz szkolenie',
      welcomeTitle: 'Witaj w ForgeMuscle! 🔥',
      welcomeDesc: 'Twoja platforma treningowa z komputerowym widzeniem dla idealnej techniki i pojedynków.',
      homeTitle: 'Baza wiedzy i misje 📖',
      homeDesc: 'Poznaj podstawy hipertrofii, biomechaniki i wykonaj pierwsze zadania.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: '60-sekundowe pojedynki przed kamerą AI weryfikującą zakres ruchu >85% ROM.',
      chatTitle: 'Czat i pokoje głosowe 🎙️',
      chatDesc: 'Rozmawiaj ze sportowcami i szukaj rywali w czasie rzeczywistym.',
      leaderboardTitle: 'Tabela liderów 🏆',
      leaderboardDesc: 'Zdobywaj czołowe miejsca, rzucaj wyzwania i zbieraj tytuły.',
      profileTitle: 'Twój profil ⚡',
      profileDesc: 'Śledź poziom, tytuły, powtórzenia i statystyki wygranych.',
      settingsTitle: 'Ustawienia urządzeń ⚙️',
      settingsDesc: 'Dostosuj kamerę, mikrofon (w tym Push-to-Talk), język i motyw.',
      permissionsTitle: 'Uprawnienia kamery i mikrofonu 🎥',
      permissionsDesc: 'Kamera jest wymagana do liczenia powtórzeń, a mikrofon do rozmów podczas pojedynków.',
      allowCamera: 'Zezwól na kamerę',
      allowMic: 'Zezwól na mikrofon',
      cameraAllowed: 'Kamera dozwolona ✅',
      micAllowed: 'Mikrofon dozwolony ✅'
    },
    home: {
      heroTitle: 'Kuźnia Twojego Ciała',
      heroSubtitle: 'Bez mitów. Poznaj podstawy, trenuj przed kamerą AI i wygrywaj pojedynki 60s.',
      startBasics: 'Zacznij od podstaw',
      stepIndicator: 'Droga nowicjusza: Krok',
      of: 'z',
      readyCta: 'Gotowy? Pierwszy Battle',
      quizButton: 'Rozwiąż test poziomu (30s)',
      changeGoal: 'Zmień cel testu',
      firstQuests: 'Twoje pierwsze misje',
      completed: 'ukończono',
      readNotes: 'Czytaj notatkę',
      detailedTech: 'Dokładna technika',
      inBattle: 'Do walki',
      readyChallenge: 'Gotowy na wyzwanie?',
      firstBattleSub: 'Kamera AI sprawdza kąty stawów powyżej 85% ROM.'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: '60-sekundowe pojedynki i asynchroniczne zawody z inteligentną kamerą',
      modePvp: 'Pojedynek 1v1 (PvP)',
      modeCompetition: 'Zawody',
      competitionTitle: 'Zawody powtórzeń',
      competitionSubtitle: 'Ustanów najlepszy wynik w 60 sekund',
      competitionFinish: 'Zakończ próbę',
      competitionRule: 'Liczy się najlepsza próba w ciągu 60 sekund.',
      competitionScore: 'Wynik',
      competitionParticipants: 'uczestników',
      competitionJoin: 'Weź udział',
      calibration: 'Kalibracja kamery',
      callFriend: 'Zaproś znajomego',
      startCalibration: 'Przejdź do kalibracji',
      allReadySearch: 'Gotowe! Szukaj rywala',
      searchingOpponent: 'Szukamy rywala...',
      timeoutTitle: 'Nie znaleziono rywala',
      timeoutDesc: 'Wszyscy sportowcy są zajęci. Możesz zawalczyć z botem.',
      sparWithBot: 'Walka z botem Taras',
      retrySearch: 'Szukaj ponownie',
      cancelSearch: 'Anuluj szukanie',
      yourReps: 'Twoje powtórzenia',
      accuracy: 'Dokładność',
      manualRep: '+ Zlicz powtórzenie ręcznie',
      victory: 'ZWYCIĘSTWO!',
      defeat: 'DOBRA WALKA',
      draw: 'REMIS!',
      rematch: 'Rewanż',
      share: 'Udostępnij',
      copied: 'Skopiowano!',
      endDuel: 'Zakończ pojedynek',
      viewRankings: 'Do rankingu',
      thresholdRom: 'Próg zakresu ruchu 85% ROM',
      chatTitle: 'Czat pojedynku',
      voiceTitle: 'Kanał głosowy',
      challengeBanner: 'Zostałeś wyzwany na 60-sekundowy pojedynek w Forge Battle!',
      challengeGotIt: 'Rozumiem',
      preCheckTitle: 'Sprawdzenie kadru przed walką',
      preCheckDesc: 'Ustaw telefon tak, aby całe ciało było widoczne.',
      bodyInFrame: 'Ciało w kadrze ✅',
      bodyOutOfFrame: 'Cofnij się — stawy nie są widoczne',
      stepBack: 'Zrób 2 kroki w tył',
      warmupTitle: 'Rozgrzewka i bezpieczeństwo ⚠️',
      warmupDesc: 'Rozgrzej barki i nadgarstki przed serią.',
      warmupReady: 'Rozgrzany, zaczynamy!',
      noCameraMode: 'Tryb bez kamery (Ręczne liczenie)',
      manualRepsNotice: 'Kamera wyłączona. Licz powtórzenia przyciskiem lub spacją.',
      onAirCamera: 'KAMERA NA ŻYWO',
      onAirMic: 'MIKROFON AKTYWNY'
    },
    chat: {
      community: 'Społeczność Forge',
      sub: 'Kanały tekstowe i głosowe ze sportowcami',
      chatTab: 'Czat tekstowy',
      voiceTab: 'Pokoje głosowe',
      listTab: 'Lista sportowców',
      online: 'Online',
      sendPlaceholder: 'Napisz wiadomość...',
      joinRoom: 'Dołącz do pokoju',
      leaveRoom: 'Opuść pokój',
      micOn: 'Mikrofon włączony',
      micOff: 'Mikrofon wyłączony',
      connectedTo: 'Połączono z',
      duelAction: 'Wyzwij na pojedynek',
      speaking: 'Mówi...',
      reportMsg: 'Zgłoś',
      reportSent: 'Zgłoszenie wysłane',
      blockUser: 'Zablokuj',
      blockedSent: 'Użytkownik zablokowany',
      profanityWarning: 'Wiadomość zawierała wulgaryzmy i została ukryta.',
      pttHold: 'Przytrzymaj [SPACJĘ], aby mówić',
      pttRelease: 'Puść, aby wyciszyć'
    },
    profile: {
      streak: 'Dni z rzędu',
      totalXp: 'Łączne XP',
      walletTitle: 'Portfel Solana',
      walletDesc: 'Połącz portfel tylko do weryfikacji tożsamości i salda.',
      walletConnect: 'Połącz',
      walletGuest: 'Utwórz konto, aby połączyć portfel Solana.',      coins: 'Punkty żelaza',
      wins: 'Wygrane',
      winrate: 'Winrate',
      reps: 'Powtórzenia',
      questsTab: 'Misje',
      titlesTab: 'Tytuły',
      statsTab: 'Statystyki',
      claimReward: 'Odbierz nagrodę',
      inProgress: 'W trakcie',
      claimed: 'Odebrano',
      selectTitle: 'Wybierz tytuł',
      activeTitle: 'Aktywny tytuł',
      repsByExercise: 'Powtórzenia wg ćwiczeń'
    },
    settings: {
      title: 'Ustawienia Forge',
      tabMic: 'Mikrofon',
      tabCamera: 'Wideo / Kamera',
      tabAccount: 'Konto',
      tabGeneral: 'Ogólne',
      micToggle: 'Mikrofon włączony',
      micDevice: 'Urządzenie wejściowe',
      testMic: 'Test mikrofonu',
      testingMic: 'Mów do mikrofonu...',
      micLevel: 'Poziom sygnału',
      pttToggle: 'Tryb Push-to-talk',
      pttDesc: 'Mikrofon działa tylko przy przytrzymaniu przycisku.',
      permGranted: 'Zezwolono ✅',
      permDenied: 'Zablokowano ❌',
      permPrompt: 'Wymagane uprawnienie',
      permDeniedGuide: 'Kliknij ikonę kłódki w pasku adresu przeglądarki i zezwól na dostęp.',
      cameraToggle: 'Kamera włączona',
      cameraDevice: 'Wybór kamery',
      testCamera: 'Test kamery',
      frontCamera: 'Przednia kamera',
      backCamera: 'Tylna kamera',
      showSkeleton: 'Pokaż szkielet',
      mirrorVideo: 'Lustrzane odbicie',
      previewTitle: 'Podgląd wideo',
      accountInfo: 'Informacje o koncie',
      registeredAt: 'Data rejestracji',
      editNickAvatar: 'Edytuj nick i awatar',
      changePassword: 'Zmień hasło',
      curPass: 'Aktualne hasło',
      newPass: 'Nowe hasło',
      savePass: 'Zapisz hasło',
      activeSessions: 'Aktywne sesje',
      exportData: 'Eksportuj dane (JSON)',
      deleteData: 'Wyczyść historię treningów',
      deleteDataConfirm: 'Zresetować historię i XP? Konto zostanie zachowane.',
      logoutBtn: 'Wyloguj się',
      logoutAllBtn: 'Wyloguj na wszystkich urządzeniach',
      deleteAccBtn: 'Usuń konto trwale',
      modalLogoutTitle: 'Wylogowanie z ForgeMuscle',
      modalLogoutDesc: 'Czy na pewno chcesz się wylogować?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Zostań',
      modalConfirmLogout: 'Wyloguj',
      modalDeleteTitle: 'Usuwanie konta',
      modalDeleteDesc: 'Działanie nieodwracalne. Wszystkie postępy zostaną usunięte.',
      modalTypeDelete: 'Wpisz USUŃ aby potwierdzić:',
      modalConfirmDelete: 'Usuń trwale',
      language: 'Język',
      theme: 'Motyw',
      dark: 'Ciemny (Forge Ember)',
      light: 'Jasny',
      sounds: 'Dźwięki',
      haptics: 'Wibracje',
      notifications: 'Powiadomienia',
      privacy: 'Prywatność',
      public: 'Publiczny',
      friendsOnly: 'Tylko znajomi',
      restartTour: 'Powtórz samouczek',
      aboutApp: 'O aplikacji',
      version: 'ForgeMuscle v2.0.0',
      installPwa: 'Zainstaluj aplikację (PWA)',
      pwaInstalled: 'Aplikacja zainstalowana'
    },
    offline: {
      title: 'Brak połączenia z internetem',
      desc: 'ForgeMuscle działa w trybie offline.',
      retry: 'Ponów próbę'
    },
    common: {
      xp: 'XP',
      level: 'Poziom',
      step: 'Krok',
      coins: 'pkt',
      cancel: 'Anuluj',
      confirm: 'Potwierdź',
      close: 'Zamknij',
      save: 'Zapisz',
      success: 'Sukces!',
      error: 'Błąd'
    }
  },
  de: {
    nav: {
      home: 'Home',
      battle: 'Battle',
      chat: 'Chat / Voice',
      leaderboard: 'Rangliste',
      profile: 'Profil',
      settings: 'Einstellungen'
    },
    auth: {
      checkingSession: 'Sitzung wird überprüft...',
      title: 'Die Schmiede deines Körpers',
      subtitle: 'Melde dich an oder registriere dich für das Training',
      loginTab: 'Anmelden',
      registerTab: 'Registrieren',
      forgotTab: 'Passwort vergessen',
      emailLabel: 'E-Mail-Adresse',
      passwordLabel: 'Passwort',
      nickLabel: 'Athleten-Spitzname',
      loginBtn: 'Anmelden',
      registerBtn: 'Konto erstellen',
      forgotBtn: 'Anleitung senden',
    guestBtn: 'Als Gast anmelden',
      orDivider: 'oder mit E-Mail',
      forgotLink: 'Passwort vergessen?',
      backToLogin: 'Zurück zur Anmeldung',
      resetSuccessMsg: 'Anleitung zum Zurücksetzen gesendet!',
      termsNotice: 'Mit der Registrierung akzeptierst du die ForgeMuscle-Regeln.',
      duplicateNick: 'Dieser Spitzname ist bereits vergeben.',
      invalidCredentials: 'Ungültige E-Mail oder Passwort.',
      shortPassword: 'Passwort muss mindestens 6 Zeichen lang sein.',
    },
    onboarding: {
      stepOf: 'Schritt {step} von {total}',
      next: 'Weiter',
      prev: 'Zurück',
      skip: 'Überspringen',
      finish: 'Fertigstellen',
      restartBtn: 'Einführung wiederholen',
      welcomeTitle: 'Willkommen bei ForgeMuscle! 🔥',
      welcomeDesc: 'Deine Fitnessplattform mit Computer-Vision für saubere Ausführung und faire Duelle.',
      homeTitle: 'Wissensbasis & Quests 📖',
      homeDesc: 'Lerne Hypertrophie-Grundlagen und schließe deine ersten Quests ab.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: '60-Sekunden-Duelle vor der KI-Kamera (>85% ROM Bewegungsamplitude).',
      chatTitle: 'Chat & Sprachräume 🎙️',
      chatDesc: 'Tausche dich in Echtzeit mit Athleten aus.',
      leaderboardTitle: 'Rangliste 🏆',
      leaderboardDesc: 'Kämpfe um die Spitze und sammle Titel.',
      profileTitle: 'Dein Athletenprofil ⚡',
      profileDesc: 'Verfolge Level, Titel, Wiederholungen und Siegquote.',
      settingsTitle: 'Geräteeinstellungen ⚙️',
      settingsDesc: 'Verwalte Kamera, Mikrofon, Push-to-Talk und Sprache.',
      permissionsTitle: 'Kamera- & Mikrofonberechtigungen 🎥',
      permissionsDesc: 'Kamera für KI-Wiederholungszählung, Mikrofon für Duell-Sprachchat.',
      allowCamera: 'Kamera erlauben',
      allowMic: 'Mikrofon erlauben',
      cameraAllowed: 'Kamera erlaubt ✅',
      micAllowed: 'Mikrofon erlaubt ✅'
    },
    home: {
      heroTitle: 'Die Schmiede deines Körpers',
      heroSubtitle: 'Keine Mythen. Meistere die Grundlagen und gewinne 60s Duelle.',
      startBasics: 'Mit den Grundlagen starten',
      stepIndicator: 'Anfängerpfad: Schritt',
      of: 'von',
      readyCta: 'Bereit? Erstes Battle',
      quizButton: 'Level-Test machen (30s)',
      changeGoal: 'Ziel ändern',
      firstQuests: 'Deine ersten Quests',
      completed: 'abgeschlossen',
      readNotes: 'Zusammenfassung lesen',
      detailedTech: 'Detaillierte Technik',
      inBattle: 'Zum Battle',
      readyChallenge: 'Bereit für die Herausforderung?',
      firstBattleSub: 'Die KI-Kamera überprüft Gelenkwinkel über 85% ROM.'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: '60-Sekunden-Duelle mit smarter Kamera',
      modePvp: '1v1 Duell (PvP)',
      modeCompetition: 'Wettbewerb',
      competitionTitle: 'Wiederholungs-Wettbewerb',
      competitionSubtitle: 'Setze deine Bestleistung in 60 Sekunden',
      competitionFinish: 'Versuch beenden',
      competitionRule: 'Dein bester 60-Sekunden-Versuch zählt.',
      competitionScore: 'Ergebnis',
      competitionParticipants: 'Teilnehmer',
      competitionJoin: 'Teilnehmen',
      calibration: 'Kamerakalibrierung',
      callFriend: 'Freund herausfordern',
      startCalibration: 'Zur Kalibrierung',
      allReadySearch: 'Bereit! Gegner suchen',
      searchingOpponent: 'Gegner wird gesucht...',
      timeoutTitle: 'Kein Gegner gefunden',
      timeoutDesc: 'Alle Athleten sind beschäftigt. Duell mit Bot möglich.',
      sparWithBot: 'Sparring mit Bot Taras',
      retrySearch: 'Erneut suchen',
      cancelSearch: 'Suche abbrechen',
      yourReps: 'Deine Wiederholungen',
      accuracy: 'Präzision',
      manualRep: '+ Manuell zählen (Sensor)',
      victory: 'SIEG!',
      defeat: 'GUTER KAMPF',
      draw: 'UNENTSCHIEDEN!',
      rematch: 'Revanche',
      share: 'Teilen',
      copied: 'Kopiert!',
      endDuel: 'Duell beenden',
      viewRankings: 'Zur Rangliste',
      thresholdRom: '85% ROM Amplitude',
      chatTitle: 'Kampfchat',
      voiceTitle: 'Sprachkanal',
      challengeBanner: 'Du wurdest zu einem 60s Duell in Forge Battle herausgefordert!',
      challengeGotIt: 'Verstanden',
      preCheckTitle: 'Kamera-Check vor dem Kampf',
      preCheckDesc: 'Positioniere das Gerät so, dass der ganze Körper sichtbar ist.',
      bodyInFrame: 'Körper vollständig im Bild ✅',
      bodyOutOfFrame: 'Tritt zurück — Gelenke nicht sichtbar',
      stepBack: '2 Schritte zurücktreten',
      warmupTitle: 'Aufwärmen & Sicherheit ⚠️',
      warmupDesc: 'Wärme Schultern und Handgelenke vor dem Satz auf.',
      warmupReady: 'Aufgewärmt, los gehts!',
      noCameraMode: 'Modus ohne Kamera (Manuell)',
      manualRepsNotice: 'Kamera deaktiviert. Zähle mit Taste oder Leertaste.',
      onAirCamera: 'KAMERA LIVE',
      onAirMic: 'MIKROFON AKTIV'
    },
    chat: {
      community: 'Forge-Community',
      sub: 'Textkanäle und Live-Sprachchat',
      chatTab: 'Textchat',
      voiceTab: 'Sprachräume',
      listTab: 'Athletenliste',
      online: 'Online',
      sendPlaceholder: 'Nachricht eingeben...',
      joinRoom: 'Raum beitreten',
      leaveRoom: 'Raum verlassen',
      micOn: 'Mikrofon an',
      micOff: 'Mikrofon aus',
      connectedTo: 'Verbunden mit',
      duelAction: 'Zum Duell fordern',
      speaking: 'Spricht...',
      reportMsg: 'Melden',
      reportSent: 'Meldung gesendet',
      blockUser: 'Blockieren',
      blockedSent: 'Nutzer blockiert',
      profanityWarning: 'Nachricht enthielt unangebrachte Sprache.',
      pttHold: '[LEERTASTE] halten zum Sprechen',
      pttRelease: 'Loslassen zum Stummschalten'
    },
    profile: {
      streak: 'Tages-Serie',
      totalXp: 'Gesamt-XP',
      walletTitle: 'Solana-Wallet',
      walletDesc: 'Verknüpfe dein Wallet nur zur Identitätsprüfung und Anzeige des Guthabens.',
      walletConnect: 'Verbinden',
      walletGuest: 'Erstelle ein Konto, um ein Solana-Wallet zu verbinden.',      coins: 'Eisenpunkte',
      wins: 'Siege',
      winrate: 'Siegquote',
      reps: 'Wiederholungen',
      questsTab: 'Quests',
      titlesTab: 'Titel',
      statsTab: 'Statistiken',
      claimReward: 'Belohnung abholen',
      inProgress: 'In Bearbeitung',
      claimed: 'Abgeholt',
      selectTitle: 'Titel auswählen',
      activeTitle: 'Aktiver Titel',
      repsByExercise: 'Wiederholungen nach Übung'
    },
    settings: {
      title: 'Forge-Einstellungen',
      tabMic: 'Mikrofon',
      tabCamera: 'Video / Kamera',
      tabAccount: 'Konto',
      tabGeneral: 'Allgemein',
      micToggle: 'Mikrofon aktiviert',
      micDevice: 'Audio-Eingabegerät',
      testMic: 'Mikrofon testen',
      testingMic: 'Sprich ins Mikrofon...',
      micLevel: 'Eingangspegel',
      pttToggle: 'Push-to-Talk-Modus',
      pttDesc: 'Mikrofon überträgt nur bei gehaltener Taste.',
      permGranted: 'Erlaubt ✅',
      permDenied: 'Blockiert ❌',
      permPrompt: 'Erlaubnis erforderlich',
      permDeniedGuide: 'Klicke auf das Schloss-Symbol in der Adressleiste.',
      cameraToggle: 'Kamera aktiviert',
      cameraDevice: 'Kameraauswahl',
      testCamera: 'Kamera testen',
      frontCamera: 'Frontkamera',
      backCamera: 'Rückkamera',
      showSkeleton: 'Skelett anzeigen',
      mirrorVideo: 'Video spiegeln',
      previewTitle: 'Videovorschau',
      accountInfo: 'Kontoinformationen',
      registeredAt: 'Registriert am',
      editNickAvatar: 'Spitzname & Avatar bearbeiten',
      changePassword: 'Passwort ändern',
      curPass: 'Aktuelles Passwort',
      newPass: 'Neues Passwort',
      savePass: 'Passwort speichern',
      activeSessions: 'Aktive Sitzungen',
      exportData: 'Daten exportieren (JSON)',
      deleteData: 'Trainingsverlauf zurücksetzen',
      deleteDataConfirm: 'Verlauf und XP zurücksetzen? Konto bleibt bestehen.',
      logoutBtn: 'Abmelden',
      logoutAllBtn: 'Auf allen Geräten abmelden',
      deleteAccBtn: 'Konto dauerhaft löschen',
      modalLogoutTitle: 'Von ForgeMuscle abmelden',
      modalLogoutDesc: 'Möchtest du dich wirklich abmelden?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Bleiben',
      modalConfirmLogout: 'Abmelden',
      modalDeleteTitle: 'Konto dauerhaft löschen',
      modalDeleteDesc: 'Diese Aktion ist endgültig. Alle Daten werden gelöscht.',
      modalTypeDelete: 'Tippe LÖSCHEN zur Bestätigung:',
      modalConfirmDelete: 'Endgültig löschen',
      language: 'Sprache',
      theme: 'Design',
      dark: 'Dunkel (Forge Ember)',
      light: 'Hell',
      sounds: 'Töne',
      haptics: 'Vibration',
      notifications: 'Benachrichtigungen',
      privacy: 'Privatsphäre',
      public: 'Öffentlich',
      friendsOnly: 'Nur Freunde',
      restartTour: 'Einführung wiederholen',
      aboutApp: 'Über die App',
      version: 'ForgeMuscle v2.0.0',
      installPwa: 'Als App installieren (PWA)',
      pwaInstalled: 'App ist installiert'
    },
    offline: {
      title: 'Keine Internetverbindung',
      desc: 'ForgeMuscle läuft derzeit offline.',
      retry: 'Wiederholen'
    },
    common: {
      xp: 'XP',
      level: 'Level',
      step: 'Schritt',
      coins: 'Punkte',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      close: 'Schließen',
      save: 'Speichern',
      success: 'Erfolg!',
      error: 'Fehler'
    }
  },
  fr: {
    nav: {
      home: 'Accueil',
      battle: 'Combat',
      chat: 'Chat / Voice',
      leaderboard: 'Classement',
      profile: 'Profil',
      settings: 'Paramètres'
    },
    auth: {
      checkingSession: 'Vérification de session...',
      title: 'La Forge de Votre Corps',
      subtitle: 'Connectez-vous ou inscrivez-vous pour continuer',
      loginTab: 'Connexion',
      registerTab: 'Inscription',
      forgotTab: 'Mot de passe oublié',
      emailLabel: 'Adresse e-mail',
      passwordLabel: 'Mot de passe',
      nickLabel: 'Pseudo de l’athlète',
      loginBtn: 'Se connecter',
      registerBtn: 'Créer un compte',
      forgotBtn: 'Envoyer les instructions',
    guestBtn: 'Continuer comme invité',
      orDivider: 'ou avec un e-mail',
      forgotLink: 'Mot de passe oublié ?',
      backToLogin: 'Retour à la connexion',
      resetSuccessMsg: 'Instructions de réinitialisation envoyées !',
      termsNotice: 'En vous inscrivant, vous acceptez les règles de ForgeMuscle.',
      duplicateNick: 'Ce pseudo est déjà utilisé.',
      invalidCredentials: 'E-mail ou mot de passe incorrect.',
      shortPassword: 'Le mot de passe doit comporter au moins 6 caractères.',
    },
    onboarding: {
      stepOf: 'Étape {step} sur {total}',
      next: 'Suivant',
      prev: 'Précédent',
      skip: 'Passer',
      finish: 'Terminer',
      restartBtn: 'Recommencer le tutoriel',
      welcomeTitle: 'Bienvenue sur ForgeMuscle ! 🔥',
      welcomeDesc: 'Votre plateforme de fitness avec vision par ordinateur pour une technique parfaite et des duels équitables.',
      homeTitle: 'Base de connaissances & Quêtes 📖',
      homeDesc: 'Apprenez les bases de l’hypertrophie et accomplissez vos premières quêtes.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: 'Duels de 60 secondes devant la caméra IA (>85% ROM amplitude).',
      chatTitle: 'Chat & Salons vocaux 🎙️',
      chatDesc: 'Échangez avec les athlètes en temps réel.',
      leaderboardTitle: 'Classement 🏆',
      leaderboardDesc: 'Visez le sommet et remportez des titres de prestige.',
      profileTitle: 'Votre Profil Athlète ⚡',
      profileDesc: 'Suivez votre niveau, titres, répétitions et victoires.',
      settingsTitle: 'Paramètres des appareils ⚙️',
      settingsDesc: 'Configurez caméra, micro (Push-to-Talk inclus), langue et thème.',
      permissionsTitle: 'Autorisations Caméra & Micro 🎥',
      permissionsDesc: 'La caméra est requise pour compter les répétitions et le micro pour le chat vocal.',
      allowCamera: 'Autoriser la caméra',
      allowMic: 'Autoriser le microphone',
      cameraAllowed: 'Caméra autorisée ✅',
      micAllowed: 'Microphone autorisé ✅'
    },
    home: {
      heroTitle: 'La Forge de Votre Corps',
      heroSubtitle: 'Sans mythes. Maîtrisez les bases et gagnez des duels de 60s.',
      startBasics: 'Commencer par les bases',
      stepIndicator: 'Parcours débutant : Étape',
      of: 'sur',
      readyCta: 'Prêt ? Premier Combat',
      quizButton: 'Faire le test de niveau (30s)',
      changeGoal: 'Changer l’objectif',
      firstQuests: 'Vos premières quêtes',
      completed: 'terminé',
      readNotes: 'Lire le résumé',
      detailedTech: 'Technique détaillée',
      inBattle: 'Au combat',
      readyChallenge: 'Prêt pour le défi ?',
      firstBattleSub: 'La caméra IA vérifie les angles articulaires >85% ROM.'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: 'Duels de 60 secondes avec caméra intelligente',
      modePvp: 'Duel 1v1 (PvP)',
      modeCompetition: 'Compétition',
      competitionTitle: 'Compétition de répétitions',
      competitionSubtitle: 'Réalisez votre meilleur score en 60 secondes',
      competitionFinish: 'Terminer',
      competitionRule: 'Votre meilleure tentative de 60 secondes compte.',
      competitionScore: 'Score',
      competitionParticipants: 'participants',
      competitionJoin: 'Participer',
      calibration: 'Calibrage de la caméra',
      callFriend: 'Défier un ami',
      startCalibration: 'Passer au calibrage',
      allReadySearch: 'Prêt ! Trouver un adversaire',
      searchingOpponent: 'Recherche d’un adversaire...',
      timeoutTitle: 'Aucun adversaire trouvé',
      timeoutDesc: 'Tous les athlètes sont occupés. Combattez le bot.',
      sparWithBot: 'Sparring avec Bot Taras',
      retrySearch: 'Réessayer',
      cancelSearch: 'Annuler la recherche',
      yourReps: 'Vos répétitions',
      accuracy: 'Précision',
      manualRep: '+ Compter manuellement (Capteur)',
      victory: 'VICTOIRE !',
      defeat: 'BEAU COMBAT',
      draw: 'MATCH NUL !',
      rematch: 'Revanche',
      share: 'Partager',
      copied: 'Copié !',
      endDuel: 'Terminer le duel',
      viewRankings: 'Voir le classement',
      thresholdRom: 'Seuil d’amplitude 85% ROM',
      chatTitle: 'Chat de combat',
      voiceTitle: 'Salon vocal',
      challengeBanner: 'Vous avez été défié en duel de 60s sur Forge Battle !',
      challengeGotIt: 'Compris',
      preCheckTitle: 'Vérification avant le duel',
      preCheckDesc: 'Positionnez l’appareil de manière à voir tout votre corps.',
      bodyInFrame: 'Corps entièrement dans le cadre ✅',
      bodyOutOfFrame: 'Reculez — articulations non visibles',
      stepBack: 'Reculez de 2 pas',
      warmupTitle: 'Échauffement & Sécurité ⚠️',
      warmupDesc: 'Échauffez vos épaules et poignets avant la série.',
      warmupReady: 'Échauffé, c’est parti !',
      noCameraMode: 'Mode sans caméra (Manuel)',
      manualRepsNotice: 'Caméra désactivée. Comptez avec le bouton ou la barre d’espace.',
      onAirCamera: 'CAMÉRA EN DIRECT',
      onAirMic: 'MICRO ACTIF'
    },
    chat: {
      community: 'Communauté Forge',
      sub: 'Canaux textuels et audio en direct',
      chatTab: 'Chat textuel',
      voiceTab: 'Salons vocaux',
      listTab: 'Liste des athlètes',
      online: 'En ligne',
      sendPlaceholder: 'Écrire un message...',
      joinRoom: 'Rejoindre',
      leaveRoom: 'Quitter',
      micOn: 'Micro activé',
      micOff: 'Micro désactivé',
      connectedTo: 'Connecté à',
      duelAction: 'Défier en duel',
      speaking: 'Parle...',
      reportMsg: 'Signaler',
      reportSent: 'Signalement envoyé',
      blockUser: 'Bloquer',
      blockedSent: 'Utilisateur bloqué',
      profanityWarning: 'Message masqué en raison de termes inappropriés.',
      pttHold: 'Maintenir [ESPACE] pour parler',
      pttRelease: 'Relâcher pour couper le micro'
    },
    profile: {
      streak: 'Série de jours',
      totalXp: 'XP Total',
      walletTitle: 'Portefeuille Solana',
      walletDesc: 'Liez votre portefeuille uniquement pour vérifier l’identité et le solde.',
      walletConnect: 'Connecter',
      walletGuest: 'Créez un compte pour connecter un portefeuille Solana.',      coins: 'Points de fer',
      wins: 'Victoires',
      winrate: 'Taux de victoire',
      reps: 'Répétitions',
      questsTab: 'Quêtes',
      titlesTab: 'Titres',
      statsTab: 'Statistiques',
      claimReward: 'Récupérer récompense',
      inProgress: 'En cours',
      claimed: 'Récupéré',
      selectTitle: 'Choisir le titre',
      activeTitle: 'Titre actif',
      repsByExercise: 'Répétitions par exercice'
    },
    settings: {
      title: 'Paramètres Forge',
      tabMic: 'Microphone',
      tabCamera: 'Vidéo / Caméra',
      tabAccount: 'Compte',
      tabGeneral: 'Général',
      micToggle: 'Microphone activé',
      micDevice: 'Périphérique d’entrée',
      testMic: 'Tester le microphone',
      testingMic: 'Parlez dans le micro...',
      micLevel: 'Niveau d’entrée',
      pttToggle: 'Mode Push-to-talk',
      pttDesc: 'Le microphone ne transmet que lorsque vous maintenez la touche.',
      permGranted: 'Autorisé ✅',
      permDenied: 'Bloqué ❌',
      permPrompt: 'Autorisation requise',
      permDeniedGuide: 'Cliquez sur le cadenas dans la barre d’adresse de votre navigateur.',
      cameraToggle: 'Caméra activée',
      cameraDevice: 'Sélection caméra',
      testCamera: 'Tester la caméra',
      frontCamera: 'Caméra avant',
      backCamera: 'Caméra arrière',
      showSkeleton: 'Afficher le squelette',
      mirrorVideo: 'Effet miroir',
      previewTitle: 'Aperçu vidéo',
      accountInfo: 'Informations du compte',
      registeredAt: 'Date d’inscription',
      editNickAvatar: 'Modifier pseudo & avatar',
      changePassword: 'Changer le mot de passe',
      curPass: 'Mot de passe actuel',
      newPass: 'Nouveau mot de passe',
      savePass: 'Enregistrer le mot de passe',
      activeSessions: 'Sessions actives',
      exportData: 'Exporter mes données (JSON)',
      deleteData: 'Effacer l’historique d’entraînement',
      deleteDataConfirm: 'Réinitialiser l’historique et l’XP ? Le compte sera conservé.',
      logoutBtn: 'Se déconnecter',
      logoutAllBtn: 'Déconnecter tous les appareils',
      deleteAccBtn: 'Supprimer le compte définitivement',
      modalLogoutTitle: 'Déconnexion de ForgeMuscle',
      modalLogoutDesc: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Rester',
      modalConfirmLogout: 'Se déconnecter',
      modalDeleteTitle: 'Supprimer le compte',
      modalDeleteDesc: 'Action irréversible. Toutes vos données seront effacées.',
      modalTypeDelete: 'Tapez SUPPRIMER pour confirmer :',
      modalConfirmDelete: 'Supprimer définitivement',
      language: 'Langue',
      theme: 'Thème',
      dark: 'Sombre (Forge Ember)',
      light: 'Clair',
      sounds: 'Effets sonores',
      haptics: 'Vibration',
      notifications: 'Notifications',
      privacy: 'Confidentialité',
      public: 'Public',
      friendsOnly: 'Amis uniquement',
      restartTour: 'Recommencer le tutoriel',
      aboutApp: 'À propos',
      version: 'ForgeMuscle v2.0.0',
      installPwa: 'Installer l’application (PWA)',
      pwaInstalled: 'Application installée'
    },
    offline: {
      title: 'Pas de connexion Internet',
      desc: 'ForgeMuscle fonctionne actuellement en mode hors ligne.',
      retry: 'Réessayer'
    },
    common: {
      xp: 'XP',
      level: 'Niveau',
      step: 'Étape',
      coins: 'points',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      close: 'Fermer',
      save: 'Enregistrer',
      success: 'Succès !',
      error: 'Erreur'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      battle: 'Batalla',
      chat: 'Chat / Voz',
      leaderboard: 'Clasificación',
      profile: 'Perfil',
      settings: 'Ajustes'
    },
    auth: {
      checkingSession: 'Comprobando sesión del atleta...',
      title: 'La Forja de Tu Cuerpo',
      subtitle: 'Inicia sesión o regístrate para continuar',
      loginTab: 'Iniciar sesión',
      registerTab: 'Registrarse',
      forgotTab: 'Recuperar',
      emailLabel: 'Correo electrónico',
      passwordLabel: 'Contraseña',
      nickLabel: 'Apodo del atleta',
      loginBtn: 'Iniciar sesión',
      registerBtn: 'Crear cuenta',
      forgotBtn: 'Enviar instrucciones',
    guestBtn: 'Entrar como invitado',
      orDivider: 'o con correo',
      forgotLink: '¿Olvidaste tu contraseña?',
      backToLogin: 'Volver a iniciar sesión',
      resetSuccessMsg: '¡Instrucciones de restablecimiento enviadas!',
      termsNotice: 'Al registrarte, aceptas las reglas de ForgeMuscle.',
      duplicateNick: 'Este apodo ya está en uso.',
      invalidCredentials: 'Correo o contraseña incorrectos.',
      shortPassword: 'La contraseña debe tener al menos 6 caracteres.',
    },
    onboarding: {
      stepOf: 'Paso {step} de {total}',
      next: 'Siguiente',
      prev: 'Atrás',
      skip: 'Omitir',
      finish: 'Finalizar',
      restartBtn: 'Repetir tutorial',
      welcomeTitle: '¡Bienvenido a ForgeMuscle! 🔥',
      welcomeDesc: 'Tu plataforma de fitness con visión artificial para una técnica impecable y duelos justos.',
      homeTitle: 'Base de conocimiento y misiones 📖',
      homeDesc: 'Aprende los conceptos básicos de hipertrofia y completa tus primeras misiones.',
      battleTitle: 'Forge Battle 60s ⚔️',
      battleDesc: 'Duelos de 60 segundos ante la cámara IA (>85% ROM amplitud de movimiento).',
      chatTitle: 'Chat y Salas de Voz 🎙️',
      chatDesc: 'Conéctate con atletas en tiempo real.',
      leaderboardTitle: 'Clasificación 🏆',
      leaderboardDesc: 'Compite por los primeros puestos y gana títulos de prestigio.',
      profileTitle: 'Tu Perfil de Atleta ⚡',
      profileDesc: 'Sigue tu nivel, títulos, repeticiones y porcentaje de victorias.',
      settingsTitle: 'Ajustes de dispositivos ⚙️',
      settingsDesc: 'Configura cámara, micrófono (Push-to-Talk incluido), idioma y tema.',
      permissionsTitle: 'Permisos de Cámara y Micrófono 🎥',
      permissionsDesc: 'La cámara es necesaria para contar repeticiones y el micrófono para el chat de voz en duelos.',
      allowCamera: 'Permitir cámara',
      allowMic: 'Permitir micrófono',
      cameraAllowed: 'Cámara permitida ✅',
      micAllowed: 'Micrófono permitido ✅'
    },
    home: {
      heroTitle: 'La Forja de Tu Cuerpo',
      heroSubtitle: 'Sin mitos. Domina las bases y gana duelos de 60 segundos.',
      startBasics: 'Empezar con lo básico',
      stepIndicator: 'Camino del novato: Paso',
      of: 'de',
      readyCta: '¿Listo? Primera Batalla',
      quizButton: 'Hacer test de nivel (30s)',
      changeGoal: 'Cambiar objetivo',
      firstQuests: 'Tus primeras misiones',
      completed: 'completado',
      readNotes: 'Leer resumen',
      detailedTech: 'Técnica detallada',
      inBattle: 'A la batalla',
      readyChallenge: '¿Listo para el desafío?',
      firstBattleSub: 'La cámara IA verifica ángulos articulares >85% ROM.'
    },
    battle: {
      title: 'Forge Battle',
      subtitle: 'Duelos de 60 segundos con cámara inteligente',
      modePvp: 'Duelo 1v1 (PvP)',
      modeCompetition: 'Competición',
      competitionTitle: 'Competición de repeticiones',
      competitionSubtitle: 'Logra tu mejor resultado en 60 segundos',
      competitionFinish: 'Finalizar',
      competitionRule: 'Cuenta tu mejor intento de 60 segundos.',
      competitionScore: 'Puntuación',
      competitionParticipants: 'participantes',
      competitionJoin: 'Participar',
      calibration: 'Calibración de cámara',
      callFriend: 'Desafiar a un amigo',
      startCalibration: 'Ir a calibración',
      allReadySearch: '¡Listo! Buscar oponente',
      searchingOpponent: 'Buscando oponente...',
      timeoutTitle: 'No se encontró oponente',
      timeoutDesc: 'Todos los atletas están ocupados. Puedes luchar con el bot.',
      sparWithBot: 'Sparring con Bot Taras',
      retrySearch: 'Buscar de nuevo',
      cancelSearch: 'Cancelar búsqueda',
      yourReps: 'Tus repeticiones',
      accuracy: 'Precisión',
      manualRep: '+ Contar repetición manual (Sensor)',
      victory: '¡VICTORIA!',
      defeat: 'BUENA PELEA',
      draw: '¡EMPATE!',
      rematch: 'Revancha',
      share: 'Compartir',
      copied: '¡Copiado!',
      endDuel: 'Finalizar duelo',
      viewRankings: 'Ver clasificación',
      thresholdRom: 'Umbral de amplitud 85% ROM',
      chatTitle: 'Chat de batalla',
      voiceTitle: 'Canal de voz',
      challengeBanner: '¡Has sido desafiado a un duelo de 60s en Forge Battle!',
      challengeGotIt: 'Entendido',
      preCheckTitle: 'Verificación de cámara previa',
      preCheckDesc: 'Coloca el dispositivo de forma que se vea todo tu cuerpo.',
      bodyInFrame: 'Cuerpo completo en el encuadre ✅',
      bodyOutOfFrame: 'Da unos pasos atrás — articulaciones no visibles',
      stepBack: 'Da 2 pasos atrás',
      warmupTitle: 'Calentamiento y Seguridad ⚠️',
      warmupDesc: 'Calienta hombros y muñecas antes de la serie.',
      warmupReady: 'Calentado, ¡vamos!',
      noCameraMode: 'Modo sin cámara (Manual)',
      manualRepsNotice: 'Cámara desactivada. Cuenta con el botón o la barra espaciadora.',
      onAirCamera: 'CÁMARA EN VIVO',
      onAirMic: 'MICRÓFONO ACTIVO'
    },
    chat: {
      community: 'Comunidad Forge',
      sub: 'Canales de texto y voz en directo',
      chatTab: 'Chat de texto',
      voiceTab: 'Salas de voz',
      listTab: 'Lista de atletas',
      online: 'En línea',
      sendPlaceholder: 'Escribe un mensaje...',
      joinRoom: 'Unirse a la sala',
      leaveRoom: 'Salir de la sala',
      micOn: 'Micrófono activado',
      micOff: 'Micrófono desactivado',
      connectedTo: 'Conectado a',
      duelAction: 'Desafiar a duelo',
      speaking: 'Hablando...',
      reportMsg: 'Reportar',
      reportSent: 'Reporte enviado a moderadores',
      blockUser: 'Bloquear',
      blockedSent: 'Usuario bloqueado',
      profanityWarning: 'El mensaje contenía lenguaje inapropiado y fue filtrado.',
      pttHold: 'Mantén [ESPACIO] para hablar',
      pttRelease: 'Suelta para silenciar'
    },
    profile: {
      streak: 'Días de racha',
      totalXp: 'XP Total',
      walletTitle: 'Cartera Solana',
      walletDesc: 'Vincula tu cartera solo para verificar identidad y saldo.',
      walletConnect: 'Conectar',
      walletGuest: 'Crea una cuenta para conectar una cartera Solana.',      coins: 'Puntos de hierro',
      wins: 'Victorias',
      winrate: 'Tasa de victoria',
      reps: 'Repeticiones',
      questsTab: 'Misiones',
      titlesTab: 'Títulos',
      statsTab: 'Estadísticas',
      claimReward: 'Reclamar recompensa',
      inProgress: 'En progreso',
      claimed: 'Reclamado',
      selectTitle: 'Elegir título',
      activeTitle: 'Título activo',
      repsByExercise: 'Repeticiones por ejercicio'
    },
    settings: {
      title: 'Ajustes Forge',
      tabMic: 'Micrófono',
      tabCamera: 'Vídeo / Cámara',
      tabAccount: 'Cuenta',
      tabGeneral: 'General',
      micToggle: 'Micrófono activado',
      micDevice: 'Dispositivo de entrada',
      testMic: 'Probar micrófono',
      testingMic: 'Habla por el micrófono...',
      micLevel: 'Nivel de señal',
      pttToggle: 'Modo Push-to-talk',
      pttDesc: 'El micrófono solo transmite cuando mantienes presionado.',
      permGranted: 'Permitido ✅',
      permDenied: 'Bloqueado ❌',
      permPrompt: 'Permiso requerido',
      permDeniedGuide: 'Haz clic en el candado de la barra de direcciones del navegador.',
      cameraToggle: 'Cámara activada',
      cameraDevice: 'Selección de cámara',
      testCamera: 'Probar cámara',
      frontCamera: 'Cámara frontal',
      backCamera: 'Cámara trasera',
      showSkeleton: 'Mostrar esqueleto',
      mirrorVideo: 'Efecto espejo',
      previewTitle: 'Vista previa de vídeo',
      accountInfo: 'Información de la cuenta',
      registeredAt: 'Fecha de registro',
      editNickAvatar: 'Editar apodo y avatar',
      changePassword: 'Cambiar contraseña',
      curPass: 'Contraseña actual',
      newPass: 'Nueva contraseña',
      savePass: 'Guardar contraseña',
      activeSessions: 'Sesiones activas',
      exportData: 'Exportar mis datos (JSON)',
      deleteData: 'Restablecer historial de entrenamiento',
      deleteDataConfirm: '¿Restablecer historial y XP? La cuenta se mantendrá.',
      logoutBtn: 'Cerrar sesión',
      logoutAllBtn: 'Cerrar sesión en todos los dispositivos',
      deleteAccBtn: 'Eliminar cuenta permanentemente',
      modalLogoutTitle: 'Cerrar sesión de ForgeMuscle',
      modalLogoutDesc: '¿Estás seguro de que deseas cerrar sesión?',
    guestLogoutDesc: 'Гостьовий акаунт буде видалено назавжди, повернутися в нього не можна. Створи акаунт (пошта + пароль), щоб зберегти прогрес.',
      modalStay: 'Quedarse',
      modalConfirmLogout: 'Cerrar sesión',
      modalDeleteTitle: 'Eliminar cuenta',
      modalDeleteDesc: 'Esta acción es irreversible. Se borrarán todos los datos.',
      modalTypeDelete: 'Escribe ELIMINAR para confirmar:',
      modalConfirmDelete: 'Eliminar permanentemente',
      language: 'Idioma',
      theme: 'Tema',
      dark: 'Oscuro (Forge Ember)',
      light: 'Claro',
      sounds: 'Sonidos',
      haptics: 'Vibración',
      notifications: 'Notificaciones',
      privacy: 'Privacidad',
      public: 'Público',
      friendsOnly: 'Solo amigos',
      restartTour: 'Repetir tutorial',
      aboutApp: 'Acerca de la app',
      version: 'ForgeMuscle v2.0.0',
      installPwa: 'Instalar como app (PWA)',
      pwaInstalled: 'App instalada'
    },
    offline: {
      title: 'Sin conexión a Internet',
      desc: 'ForgeMuscle funciona actualmente sin conexión.',
      retry: 'Reintentar'
    },
    common: {
      xp: 'XP',
      level: 'Nivel',
      step: 'Paso',
      coins: 'puntos',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      save: 'Guardar',
      success: '¡Éxito!',
      error: 'Error'
    }
  }
};

export function useI18n() {
  const user = authStore.getUser();
  const rawLang = user.settings?.language || detectBrowserLocale();
  const lang = (rawLang in translations ? rawLang : 'uk') as SupportedLocale;
  const currentDict = translations[lang] || translations.uk;

  const setLanguage = (newLang: SupportedLocale) => {
    saveUserLocale(newLang);
    authStore.updateSettings({ language: newLang });
  };

  return {
    t: currentDict,
    lang,
    setLanguage
  };
}
