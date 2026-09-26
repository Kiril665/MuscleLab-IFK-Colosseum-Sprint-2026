import { Exercise } from '../types';

export const EXERCISES: Exercise[] = [
  // CHEST
  {
    id: 'pushups_classic',
    name: 'Класичні віджимання від підлоги',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    description: 'Фундаментальна базова вправа для розвитку грудних мʼязів, трицепсів та стабілізації кору.',
    category: 'upper_body',
    cameraView: 'side',
    instructions: [
      'Займіть упор лежачи, руки на ширині плечей, корпус прямий як струна.',
      'Підконтрольно опустіть груди до підлоги, згинаючи лікті під кутом 45–60°.',
      'Потужно виштовхніть себе у вихідну позицію до повного випрямлення рук.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Тіло утворює пряму струнку лінію від пʼят до верхівки',
      'Лікті опускаються під кутом 45–60 градусів до корпусу',
      'Торкання грудьми підлоги в нижній точці та повне випрямлення вгорі',
      'Прес та сідниці постійно напружені'
    ],
    techniqueBad: [
      'Прогин у попереку або надто піднятий таз угору',
      'Розведення ліктів широко в сторони на 90 градусів (травма плечей)',
      'Неповна амплітуда (опускання лише на чверть)',
      'Опускання голови вниз замість роботи корпусом'
    ],
    repsGuide: '3-4 підходи по 12-20 повторень',
    xpPerRep: 10,
    demoType: 'video',
    youtubeId: 'IODxDxX7oi4',
    youtubeTitle: 'Правильна техніка віджимань від підлоги (Calisthenicmovement)',
    tips: 'Контролюйте опускання 2 секунди, виштовхуйтесь потужно за 1 секунду.',
    cameraVerifierId: 'push_up'
  },
  {
    id: 'pushups_wide_grip',
    name: 'Віджимання з широкою постановкою рук',
    muscle: 'chest',
    secondaryMuscles: ['shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    description: 'Варіація віджимань із широкою постановкою долонь для акцентованого навантаження на зовнішні пучки грудей.',
    category: 'upper_body',
    cameraView: 'side',
    instructions: [
      'Займіть упор лежачи, поставивши долоні ширше за плечі приблизно на півтори ширини.',
      'Підконтрольно опускайтеся вниз до прямого кута в ліктях або легкого торкання підлоги.',
      'Потужно виштовхніть корпус у вихідне положення, стискаючи грудні мʼязи.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Долоні розставлені ширше за плечі',
      'Тіло тримає пряму струнку лінію від пʼят до верхівки',
      'Повна амплітуда опускання та підйому'
    ],
    techniqueBad: [
      'Прогин у попереку',
      'Розведення ліктів строго на 90° перпендикулярно шиї',
      'Неповне випрямлення рук угорі'
    ],
    repsGuide: '3-4 підходи по 10-15 повторень',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'IODxDxX7oi4',
    youtubeTitle: 'Правильна техніка віджимань від підлоги (Calisthenicmovement)',
    tips: 'Широка постановка зміщує фокус на грудні мʼязи та зменшує навантаження на трицепс.',
    cameraVerifierId: 'push_up'
  },
  {
    id: 'dips_bars',
    name: 'Віджимання на брусах (Dips)',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    description: 'Королівська калістенічна вправа для масивного низу та середини грудей і потужних трицепсів.',
    techniqueGood: [
      'Невеликий нахил корпусу вперед (близько 30°) для акценту на груди',
      'Опускання до кута 90 градусів у ліктях або трохи глибше при здоровій мобільності',
      'Плавне підконтрольне опускання без ривків',
      'Повна фіксація у верхній точці з втисканням плечей вниз'
    ],
    techniqueBad: [
      'Надмірний провал вниз при недостатній гнучкості плечей',
      'Розгойдування ногами та використання інерції',
      'Підтягування плечей до вух під час жиму'
    ],
    repsGuide: '3-4 підходи по 8-15 повторень',
    xpPerRep: 15,
    demoType: 'video',
    youtubeId: '2z8JmcrW-As',
    youtubeTitle: 'Ідеальні віджимання на брусах: техніка та помилки (Calisthenicmovement)',
    tips: 'Для більшого включення грудей зведіть підборіддя до грудей і зігніть коліна вперед.',
    cameraVerifierId: 'dips_bars',
    cameraTrackingSupported: true
  },
  {
    id: 'bench_press_barbell',
    name: 'Жим штанги лежачи на горизонтальній лаві',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Головна класична важка вправа бодибілдингу для побудови загальної товщини та маси грудної клітки.',
    techniqueGood: [
      'Зведені та опущені лопатки («замок» на лаві)',
      'Стопи жорстко втиснуті в підлогу (leg drive)',
      'Траєкторія руху грифа — легка дуга від сосків до рівня плечей',
      'Опускання під контролем з легким торканням грудини'
    ],
    techniqueBad: [
      'Відрив сідниць від лави під час витискання',
      'Відбивання штанги від грудної клітки (відбій)',
      'Розведення ліктів перпендикулярно шиї (руйнування ротаторної манжети)',
      'Відрив пʼят від підлоги'
    ],
    repsGuide: '4 підходи по 6-10 повторень',
    xpPerRep: 20,
    demoType: 'video',
    youtubeId: '4Y2ZdHCOXok',
    youtubeTitle: 'Класичний жим штанги лежачи: правильна техніка (Buff Dudes)',
    tips: 'Дихайте за схемою: глибокий вдих перед спуском, потужний видих на подоланні мертвої точки.'
  },
  {
    id: 'incline_dumbbell_press',
    name: 'Жим гантелей на похилій лаві (30°)',
    muscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Ізольований розвиток ключичної частини (верху) грудей із максимальною амплітудою розтягування.',
    techniqueGood: [
      'Кут нахилу лави строго 30–45 градусів',
      'Глибоке підконтрольне розтягнення грудних мʼязів у нижній фазі',
      'Зведення гантелей угорі без їхнього металевого зіткнення',
      'Лопатки зафіксовані в зведеному положенні'
    ],
    techniqueBad: [
      'Нахил лави понад 60° (навантаження йде в передню дельту)',
      'Зіткнення гантелей з гуркотом у верхній точці (втрата напруження)',
      'Швидке падіння ваги в нижню точку'
    ],
    repsGuide: '3-4 підходи по 10-12 повторень',
    xpPerRep: 18,
    demoType: 'video',
    youtubeId: '8iPEnn-ltC8',
    youtubeTitle: 'Жим гантелей на похилій лаві: кут та амплітуда (Scott Herman)',
    tips: 'Утримуйте секундну паузу в піку скорочення для максимального наповнення кровʼю.'
  },
  {
    id: 'archer_pushups',
    name: 'Віджимання лучника (Archer Push-ups)',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Елітна калістенічна вправа для унілатеральної сили грудних мʼязів та переходу до віджимань на одній руці.',
    techniqueGood: [
      'Широка постановка рук',
      'Одна рука згинається, приймаючи 80% ваги, інша залишається повністю прямою',
      'Корпус тримається паралельно підлозі без перекосу',
      'Плавне чергування сторін'
    ],
    techniqueBad: [
      'Згинання допоміжної руки в лікті',
      'Скручування тазу в сторону',
      'Стрибки та ривки замість плавного ковзання'
    ],
    repsGuide: '3 підходи по 6-10 повторень на кожну сторону',
    xpPerRep: 25,
    demoType: 'video',
    youtubeId: 'MxVbNel13Ek',
    youtubeTitle: 'Віджимання лучника: техніка та прогресія крок за кроком (The Calisthenics Project)',
    tips: 'Якщо важко, почніть виконувати з опорою колінами на підлогу.',
    cameraVerifierId: 'archer_pushups',
    cameraTrackingSupported: true
  },

  // BACK
  {
    id: 'pullups_overhand',
    name: 'Підтягування широким прямим хватом',
    muscle: 'back',
    secondaryMuscles: ['biceps', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    description: 'Золотий стандарт формування V-подібної спини та сили найширших мʼязів.',
    techniqueGood: [
      'Хват трохи ширший за плечі, великі пальці обхоплюють перекладину',
      'Рух починається з опускання лопаток вниз і назад',
      'Підборіддя впевнено піднімається вище за перекладину',
      'Повне контрольоване розгинання рук у нижній точці (мертвий вис з активними лопатками)'
    ],
    techniqueBad: [
      'Кіпінг (дригання ногами та ривки всім тілом)',
      'Неповна амплітуда (тяга лише до рівня чола)',
      'Вивертання плечей уперед у верхній точці'
    ],
    repsGuide: '4 підходи по 6-12 повторень',
    xpPerRep: 18,
    demoType: 'video',
    youtubeId: 'eGo4IYlbE5g',
    youtubeTitle: 'Правильні підтягування на турніку: повний розбір (Calisthenicmovement)',
    tips: 'Уявіть, що ви тягнете лікті до кишень, а не підтягуєте себе руками.',
    cameraVerifierId: 'pull_up'
  },
  {
    id: 'muscle_up',
    name: 'Вихід силою на дві руки (Muscle-Up)',
    muscle: 'back',
    secondaryMuscles: ['chest', 'triceps', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Вершина майстерності роботи на перекладині — вибухове поєднання підтягування та виходу над турніком.',
    techniqueGood: [
      'Вибухова висока тяга до нижньої лінії грудей або пресу',
      'Своєчасний різкий перехід кистей та перекидання плечей через перекладину',
      'Потужний жим до повного випрямлення рук над турніком',
      'Симетричний підйом обох рук одночасно'
    ],
    techniqueBad: [
      'Вихід «курочкою» (спочатку одна рука, потім інша — ризик розриву звʼязок)',
      'Повний завал без контролю фази спуску'
    ],
    repsGuide: '3 підходи по 3-6 повторень',
    xpPerRep: 35,
    demoType: 'video',
    youtubeId: '_eQ2gw_Gg5Y',
    youtubeTitle: 'Вихід силою на дві руки від нуля до профі (Step by Step Guide)',
    tips: 'Працюйте над глибоким хватом (false grip) та вибуховими високими підтягуваннями.'
  },
  {
    id: 'barbell_bent_over_row',
    name: 'Тяга штанги в нахилі до поясу',
    muscle: 'back',
    secondaryMuscles: ['biceps', 'legs', 'abs'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Основний будівничий товщини спини, ромбоподібних та найширших мʼязів.',
    techniqueGood: [
      'Кут нахилу спини 45–60°, спина ідеально пряма з природним прогином',
      'Тяга грифу строго вздовж стегон до низу живота',
      'Максимальне зведення лопаток у верхній точці',
      'Коліна злегка зігнуті для розвантаження попереку'
    ],
    techniqueBad: [
      'Округлення спини (горб — небезпека для хребта)',
      'Підкидання корпусу вгору за рахунок інерції',
      'Тяга до горла замість поясу'
    ],
    repsGuide: '4 підходи по 8-12 повторень',
    xpPerRep: 20,
    demoType: 'video',
    youtubeId: 'qXrTDQG1oUQ',
    youtubeTitle: 'Тяга штанги в нахилі: повна біомеханіка та техніка (Jeremy Ethier)',
    tips: 'Зафіксуйте поперек так, ніби він закований у металевий корсет.'
  },
  {
    id: 'australian_pullups',
    name: 'Австралійські горизонтальні підтягування',
    muscle: 'back',
    secondaryMuscles: ['biceps', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    description: 'Ідеальна вправа для новачків і для розвитку середньої частини спини та задніх дельт.',
    techniqueGood: [
      'Тіло під кутом 30-45° до підлоги у прямій планці',
      'Тяга грудьми до низької перекладини',
      'Зведення лопаток у піковій точці'
    ],
    techniqueBad: [
      'Провисання тазу вниз',
      'Згинання в колінах замість рівної лінії'
    ],
    repsGuide: '3-4 підходи по 12-15 повторень',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'dvkIaarnf0g',
    youtubeTitle: 'Горизонтальні підтягування / Inverted Row (Calisthenicmovement)',
    tips: 'Чим нижче перекладина до підлоги, тим вища складність вправи.',
    cameraVerifierId: 'australian_pullups',
    cameraTrackingSupported: true
  },

  // SHOULDERS
  {
    id: 'overhead_press_barbell',
    name: 'Армійський жим стоячи (Overhead Press)',
    muscle: 'shoulders',
    secondaryMuscles: ['triceps', 'abs'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Абсолютний монумент богатирської сили плечей та міцності всього тіла.',
    techniqueGood: [
      'Штанга на ключицях, лікті спрямовані трохи вперед',
      'Потужний вертикальний жим прямо над верхівкою голови',
      'Сідниці та кор стиснуті як камінь',
      'Голова подається трохи вперед після проходження носа'
    ],
    techniqueBad: [
      'Надмірний прогин у попереку (перетворення жиму на похилий)',
      'Виштовхування ногами (це вже Push Press, а не чистий жим)',
      'Втрата рівноваги та сходження пʼят'
    ],
    repsGuide: '4 підходи по 6-8 повторень',
    xpPerRep: 22,
    demoType: 'video',
    youtubeId: '2yjwXTZQDDI',
    youtubeTitle: 'Армійський жим стоячи: залізна сила плечей (Buff Dudes)',
    tips: 'У верхній точці тягніться плечима до вух для повної стабілізації суглоба.'
  },
  {
    id: 'handstand_pushups',
    name: 'Віджимання у стійці на руках (HSPU)',
    muscle: 'shoulders',
    secondaryMuscles: ['triceps', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Титанічне калістенічне випробування дельтоподібних мʼязів власною вагою тіла.',
    techniqueGood: [
      'Голова опускається вперед перед долонями, утворюючи трикутник',
      'Лікті йдуть під кутом 45 градусів до тіла',
      'Потужний жим до повного випрямлення рук біля стіни або у вільному балансі'
    ],
    techniqueBad: [
      'Розведення ліктів широко в сторони',
      'Удар головою об підлогу без контролю спуску',
      'Банановий прогин у спині'
    ],
    repsGuide: '3 підходи по 5-10 повторень',
    xpPerRep: 30,
    demoType: 'video',
    youtubeId: 'FaO8_7qA_wU',
    youtubeTitle: 'Віджимання в стійці на руках: прогресія (Calisthenicmovement)',
    tips: 'Використовуйте мʼяку подушку або блок під голову під час вивчення.',
    cameraVerifierId: 'handstand_pushups',
    cameraTrackingSupported: true
  },
  {
    id: 'pike_pushups',
    name: 'Pike-віджимання (Куточок)',
    muscle: 'shoulders',
    secondaryMuscles: ['triceps', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    description: 'Відмінна підготовча вправа для плечей на шляху до стійки на руках.',
    techniqueGood: [
      'Таз високо піднятий угору, тіло у формі літери V',
      'Голова рухається вперед за пальці до торкання підлоги',
      'Постійний тиск у долоні'
    ],
    techniqueBad: [
      'Зсув у звичайне пласке віджимання',
      'Згинання колін'
    ],
    repsGuide: '3 підходи по 8-12 повторень',
    xpPerRep: 14,
    demoType: 'video',
    youtubeId: 'sposDXWEB0A',
    youtubeTitle: 'Pike Push Ups для дельт і підготовки до стійки (Calisthenicmovement)',
    tips: 'Ставте стопи на узвишшя (стілець чи лаву) для підвищення навантаження.',
    cameraVerifierId: 'pike_pushups',
    cameraTrackingSupported: true
  },

  // BICEPS
  {
    id: 'chin_ups',
    name: 'Підтягування зворотним хватом (Chin-ups)',
    muscle: 'biceps',
    secondaryMuscles: ['back', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    description: 'Найпотужніша базова вправа для біцепсів із використанням власної ваги тіла.',
    techniqueGood: [
      'Долоні розвернуті до обличчя на ширині плечей',
      'Повна амплітуда: від вільного вису до підборіддя над турніком',
      'Концентроване скорочення двоголового мʼяза плеча вгорі'
    ],
    techniqueBad: [
      'Смикання ногами та ривковий старт',
      'Неповне опускання вниз'
    ],
    repsGuide: '3-4 підходи по 6-12 повторень',
    xpPerRep: 16,
    demoType: 'video',
    youtubeId: 'b-_4sTqLq-0',
    youtubeTitle: 'Підтягування зворотним хватом на біцепс (Buff Dudes)',
    tips: 'Стискайте біцепси щосили в максимальній верхній точці 1 секунду.',
    cameraVerifierId: 'chin_ups',
    cameraTrackingSupported: true
  },
  {
    id: 'barbell_biceps_curl',
    name: 'Підйом EZ-штанги на біцепс стоячи',
    muscle: 'biceps',
    secondaryMuscles: ['abs'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Канонічна бодибілдерська вправа для формування піку та маси біцепса.',
    techniqueGood: [
      'Лікті жорстко зафіксовані біля боків тулуба',
      'Підйом снаряда виключно за рахунок згинання в ліктьовому суглобі',
      'Повільний негатив (опускання 2-3 секунди)'
    ],
    techniqueBad: [
      'Чітинг корпусом (розгойдування спиною)',
      'Виведення ліктів вперед (навантаження крадуть передні дельти)'
    ],
    repsGuide: '3-4 підходи по 10-12 повторень',
    xpPerRep: 16,
    demoType: 'video',
    youtubeId: 'kwG2ipFRgfo',
    youtubeTitle: 'Підйом штанги на біцепс: чиста техніка без чітингу (Buff Dudes)',
    tips: 'Використовуйте зігнутий гриф EZ для зниження крутного навантаження на запʼястя.'
  },

  // TRICEPS
  {
    id: 'diamond_pushups',
    name: 'Віджимання з вузькою постановкою рук (Diamond)',
    muscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    description: 'Максимальне фокусування на латеральній та довгій голівках трицепса без жодного заліза.',
    category: 'upper_body',
    cameraView: 'side',
    instructions: [
      'Прийміть упор лежачи, зʼєднавши великі та вказівні пальці рук у формі трикутника/діаманта під грудьми.',
      'Підконтрольно опустіть груди до торкання долонь, лікті спрямовані вздовж корпусу.',
      'Потужно виштовхніть себе вгору до повного випрямлення ліктів з акцентом на трицепс.'
    ],
    duration: '50 сек',
    cameraVerifierId: 'push_up',
    techniqueGood: [
      'Вказівні та великі пальці зʼєднані в трикутник/діамант під грудьми',
      'Лікті ковзають уздовж ребер, не розлітаючись',
      'Повне розгинання рук у верхній фазі'
    ],
    techniqueBad: [
      'Біль у запʼястях (якщо є, трохи розсуньте долоні)',
      'Прогин тазу до підлоги'
    ],
    repsGuide: '3-4 підходи по 10-15 повторень',
    xpPerRep: 16,
    demoType: 'video',
    youtubeId: 'J0DnG1_S92I',
    youtubeTitle: 'Алмазні віджимання: максимальний фокус на трицепс (Calisthenicmovement)',
    tips: 'Чим ближче долоні одна до одної, тим більший ізольований стрес на трицепс.'
  },
  {
    id: 'french_press_triceps',
    name: 'Французький жим зі штангою лежачи',
    muscle: 'triceps',
    secondaryMuscles: ['shoulders'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Класика золотого віку залізного спорту для масивної "підкови" трицепса.',
    techniqueGood: [
      'Плечі нахилені трохи назад від вертикалі для постійного натягу',
      'Опускання грифу до лінії верхівки голови',
      'Лікті залишаються на фіксованій ширині протягом усього руху'
    ],
    techniqueBad: [
      'Розведення ліктів у сторони',
      'Опускання ваги прямо на лоб (небезпека травми)'
    ],
    repsGuide: '3-4 підходи по 10-12 повторень',
    xpPerRep: 18,
    demoType: 'video',
    youtubeId: 'd_KZxkY_0aw',
    youtubeTitle: 'Французький жим лежачи / Skull Crushers (Buff Dudes)',
    tips: 'Контролюйте вагу щомиті — тут важлива техніка, а не рекордні кілограми.'
  },

  // LEGS
  {
    id: 'barbell_squats',
    name: 'Класичні присідання зі штангою на спині',
    muscle: 'legs',
    secondaryMuscles: ['abs', 'back'],
    discipline: 'bodybuilding',
    location: 'gym',
    difficulty: 'intermediate',
    description: 'Батько всіх фізичних вправ: розвиток квадрицепсів, сідниць, задньої поверхні стегна та загального гормонального фону.',
    techniqueGood: [
      'Штанга надійно лежить на трапеціях, груди розкриті',
      'Глибина присіду — тазостегновий суглоб опускається нижче колінного (нижче паралелі)',
      'Коліна рухаються строго у напрямку носків стоп',
      'Центр тяжіння чітко на середині стопи та пʼятах'
    ],
    techniqueBad: [
      'Завалювання колін всередину («х-подібні» коліна)',
      'Відрив пʼят від підлоги під час руху вниз',
      '«Кльов тазом» (округлення попереку в нижній точці)'
    ],
    repsGuide: '4-5 підходів по 6-10 повторень',
    xpPerRep: 25,
    demoType: 'video',
    youtubeId: 'bEv6CCg2BC8',
    youtubeTitle: 'Присідання зі штангою: досконала біомеханіка (Buff Dudes)',
    tips: 'Створіть внутрішньочеревний тиск (маневр Вальсальви) перед кожним повторенням.',
    cameraVerifierId: 'squat'
  },
  {
    id: 'pistol_squats',
    name: 'Присідання «Пістолетик» (Pistol Squats)',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Неймовірний баланс, гнучкість суглобів та однонога сила в одному русі калістеніки.',
    techniqueGood: [
      'Опорна стопа повністю притиснута до підлоги',
      'Вільна нога витягнута вперед паралельно землі',
      'Плавний підйом без відштовхування руками'
    ],
    techniqueBad: [
      'Відрив пʼяти опорної ноги',
      'Падіння на сідниці без контролю'
    ],
    repsGuide: '3 підходи по 5-8 повторень на ногу',
    xpPerRep: 28,
    demoType: 'video',
    youtubeId: '1-ozbmz162E',
    youtubeTitle: 'Присідання пістолетиком крок за кроком (Calisthenicmovement)',
    tips: 'Тримайтеся за стійку або петлю TRX під час освоєння рівноваги.',
    cameraVerifierId: 'pistol_squats',
    cameraTrackingSupported: true
  },
  {
    id: 'bulgarian_split_squats',
    name: 'Болгарські спліт-присідання',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'hybrid',
    location: 'home',
    difficulty: 'intermediate',
    category: 'lower_body',
    cameraView: 'side',
    cameraVerifierId: 'bulgarian_split_squats',
    cameraTrackingSupported: true,
    description: 'Універсальна вправа для побудови глибокого рельєфу стегон та сідниць з гантелями або без.',
    techniqueGood: [
      'Задня нога на лаві або опорі, передня стопа міцно на підлозі',
      'Опускання вертикально вниз до прямого кута в коліні передньої ноги',
      'Корпус тримається прямо або з легким природним нахилом вперед'
    ],
    techniqueBad: [
      'Надто коротка дистанція між ногою та лавою',
      'Удар коліном задньої ноги об підлогу'
    ],
    repsGuide: '3-4 підходи по 10-12 повторень на кожну ногу',
    xpPerRep: 20,
    demoType: 'video',
    youtubeId: '2C-uNgKwPLE',
    youtubeTitle: 'Болгарські випад-присідання для сідниць і ніг (Buff Dudes)',
    tips: 'Відмінно усуває мʼязовий дисбаланс між правою та лівою ногою.'
  },

  // ABS
  {
    id: 'hanging_leg_raises',
    name: 'Підйом прямих ніг у висі на перекладині',
    muscle: 'abs',
    secondaryMuscles: ['back'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Еталон розвитку мʼязів черевного пресу, зубчастих мʼязів та сили хвату.',
    techniqueGood: [
      'Підйом прямих ніг до торкання носками перекладини',
      'Підкручування тазу вгору наприкінці фази підйому',
      'Повільне підконтрольне опускання без гойдання'
    ],
    techniqueBad: [
      'Використання інерції розгойдування корпусу вперед-назад',
      'Підйом лише за рахунок згиначів стегна без підкручування тазу'
    ],
    repsGuide: '3-4 підходи по 10-15 повторень',
    xpPerRep: 20,
    demoType: 'video',
    youtubeId: 'Pr1ieGZ5atk',
    youtubeTitle: 'Підйом ніг у висі на турніку: без розгойдування (Calisthenicmovement)',
    tips: 'Якщо прямі ноги поки важко, почніть із підйому зігнутих у колінах ніг до грудей.',
    cameraVerifierId: 'hanging_leg_raises',
    cameraTrackingSupported: true
  },
  {
    id: 'dragon_flag',
    name: 'Прапор дракона (Dragon Flag Брюса Лі)',
    muscle: 'abs',
    secondaryMuscles: ['back', 'triceps'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    description: 'Легендарна вправа Брюса Лі для залізного пресу та монолітного тіла.',
    techniqueGood: [
      'Опора лише на верхню частину лопаток і плечі',
      'Пряма лінія від стоп до плечей під час усього підйому та спуску',
      'Повільне опускання без торкання лави сідницями'
    ],
    techniqueBad: [
      'Згинання в тазостегнових суглобах',
      'Падіння попереком на лаву'
    ],
    repsGuide: '3 підходи по 4-8 повторень',
    xpPerRep: 35,
    demoType: 'video',
    youtubeId: 'moyFIvRqSng',
    youtubeTitle: 'Прапор Дракона Брюса Лі: повне керівництво (Calisthenicmovement)',
    tips: 'Тримайте руки міцно за лаву біля голови.'
  },
  {
    id: 'floor_crunches',
    name: 'Скручування на прес (Crunches)',
    muscle: 'abs',
    secondaryMuscles: [],
    discipline: 'bodybuilding',
    location: 'home',
    difficulty: 'beginner',
    description: 'Анатомічно безпечне та ефективне скорочення прямого мʼяза живота.',
    techniqueGood: [
      'Поперек щільно притиснутий до підлоги протягом усього руху',
      'Рух здійснюється за рахунок наближення ребер до тазу',
      'Повний видих у верхній точці та пауза 1-2 секунди'
    ],
    techniqueBad: [
      'Тягання себе за шию руками (ризик травми шийних хребців)',
      'Відрив усього попереку від підлоги'
    ],
    repsGuide: '3-4 підходи по 15-25 повторень',
    xpPerRep: 10,
    demoType: 'video',
    youtubeId: 'MKmrqcoCZ-M',
    youtubeTitle: 'Правильні скручування на прес: відчуй кожен кубик (Buff Dudes)',
    tips: 'Тримайте пальці біля скронь або схрещеними на грудях, не зчіплюйте в замок на потилиці.',
    category: 'core',
    cameraView: 'side',
    instructions: [
      'Ляжте на спину, зігніть ноги в колінах, стопи на підлозі, руки біля скронь.',
      'На видиху скрутіть грудну клітку до таза, відриваючи лопатки від підлоги.',
      'Повільно поверніться у вихідне положення, зберігаючи напругу в пресі.'
    ],
    duration: '60 сек',
    cameraVerifierId: 'floor_crunches',
    cameraTrackingSupported: true
  },
  // --- НОВІ КАТЕГОРІЇ ТА ВПРАВИ ---
  // ВЕРХНЯ ЧАСТИНА ТІЛА
  {
    id: 'pushups_knees',
    name: 'Віджимання з колін (Полегшені)',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'upper_body',
    cameraView: 'side',
    cameraVerifierId: 'pushups_knees',
    cameraTrackingSupported: true,
    description: 'Оптимальний підготовчий варіант віджимань для формування правильної траєкторії ліктів без перевантаження.',
    instructions: [
      'Станьте в упор на коліна та долоні, руки на ширині плечей, таз не провисає.',
      'Підконтрольно опускайте груди до підлоги, згинаючи лікті під кутом 45–60°.',
      'Витисніть себе назад до вихідної позиції з видихом.'
    ],
    duration: '45 сек',
    techniqueGood: [
      'Тіло утворює пряму лінію від колін до плечей',
      'Прес підтягнутий, лікті не розходяться під 90 градусів'
    ],
    techniqueBad: [
      'Відстовбурчування таза назад у позу собаки',
      'Прогин у попереку'
    ],
    repsGuide: '3 підходи по 10-15 повторень',
    xpPerRep: 8,
    demoType: 'video',
    youtubeId: 'IODxDxX7oi4',
    tips: 'Тримайте шию в нейтральному положенні, дивіться на 20 см уперед перед долонями.'
  },
  {
    id: 'pushups_wall',
    name: 'Віджимання від стіни',
    muscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'upper_body',
    cameraView: 'side',
    cameraVerifierId: 'pushups_wall',
    cameraTrackingSupported: true,
    description: 'Мʼякий реабілітаційний та базовий рівень віджимань із мінімальним навантаженням на суглоби.',
    instructions: [
      'Станьте на відстані кроку від стіни, долоні на рівні плечей.',
      'Згинаючи руки в ліктях, плавно наближайте груди до стіни.',
      'Виштовхніть себе назад, зберігаючи пряму лінію хребта.'
    ],
    duration: '45 сек',
    techniqueGood: [
      'Пʼяти залишаються притиснутими або злегка відриваються одночасно',
      'Лопатки контрольовано зводяться під час наближення до стіни'
    ],
    techniqueBad: [
      'Згинання тільки в шиї без руху корпусу',
      'Розведення ліктів строго в сторони'
    ],
    repsGuide: '3 підходи по 15-20 повторень',
    xpPerRep: 6,
    demoType: 'video',
    youtubeId: 'IODxDxX7oi4',
    tips: 'Чим далі ноги від стіни, тим відчутнішим стає навантаження на мʼязи грудей.'
  },
  {
    id: 'plank_classic',
    name: 'Класична планка (Plank)',
    muscle: 'abs',
    secondaryMuscles: ['shoulders', 'chest', 'legs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'core',
    cameraView: 'side',
    cameraVerifierId: 'plank_classic',
    cameraTrackingSupported: true,
    description: 'Фундаментальна ізометрична вправа для формування міцного мʼязового корсету та стабілізації хребта.',
    instructions: [
      'Займіть упор лежачи на прямих руках, кисті строго під плечовими суглобами.',
      'Стисніть сідниці, напружте квадрицепси та підтягніть живіт до хребта.',
      'Утримуйте бездоганно рівну лінію тіла протягом усього часу без затримки дихання.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Нейтральне положення таза та шиї',
      'Грудний відділ розправлений, лопатки розведені в сторони'
    ],
    techniqueBad: [
      'Провисання попереку до підлоги',
      'Підйом таза високо вгору «будиночком»'
    ],
    repsGuide: '3 раунди по 30-60 секунд',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'pSHjTRCQxIw',
    tips: 'Уявіть, що ви намагаєтеся притягнути лікті до пальців ніг — це миттєво активує весь кор.'
  },
  // НИЖНЯ ЧАСТИНА ТІЛА
  {
    id: 'squats_bodyweight',
    name: 'Повітряні присідання (Bodyweight Squats)',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'lower_body',
    cameraView: 'side',
    cameraVerifierId: 'squat',
    description: 'Базовий рух для ніг та сідниць. Допомагає вибудувати міцну біомеханіку присіду з власною вагою.',
    instructions: [
      'Поставте ноги на ширину плечей, носки розгорніть на 15–25° назовні.',
      'Відводячи таз назад і згинаючи коліна, опустіться нижче паралелі стегон із підлогою.',
      'Потужно відштовхніться всією стопою від підлоги та поверніться у вихідне положення.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Коліна рухаються строго у напрямку носків',
      'Пʼяти не відриваються від підлоги',
      'Груди розправлені, спина пряма'
    ],
    techniqueBad: [
      'Завалювання колін усередину (вальгус)',
      'Відрив пʼят та перенесення ваги на носки',
      'Круглий поперек («клевок» таза)'
    ],
    repsGuide: '3-4 підходи по 15-25 повторень',
    xpPerRep: 10,
    demoType: 'video',
    youtubeId: 'aclHkVaku9U',
    youtubeTitle: 'Правильна техніка присідань без ваги (Bodyweight Squats)',
    tips: 'Тримайте вагу по центру стопи та не зводьте коліна всередину на підйомі.'
  },
  {
    id: 'lunges_bodyweight',
    name: 'Класичні випади вперед',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    category: 'lower_body',
    cameraView: 'side',
    cameraVerifierId: 'lunges_bodyweight',
    cameraTrackingSupported: true,
    description: 'Одноопорна вправа для детального розвитку сідниць, квадрицепсів та балансу кожної ноги окремо.',
    instructions: [
      'Зробіть широкий крок уперед, зберігаючи вертикальне положення хребта.',
      'Опустіться вниз, щоб обидва коліна утворили кут приблизно 90°.',
      'Відштовхніться передньою ногою та поверніться у вихідну стійку.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Коліно передньої ноги не виходить далеко за носок',
      'Корпус тримається рівно без завалювання вперед'
    ],
    techniqueBad: [
      'Удар коліном задньої ноги об підлогу',
      'Вузький крок, що викликає гострий кут у коліні'
    ],
    repsGuide: '3 підходи по 10-12 повторень на кожну ногу',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'QOVaHwm-Q6U',
    tips: 'Сконцентруйте тиск на пʼяті передньої ноги для максимальної активації сідничного мʼяза.'
  },
  {
    id: 'calf_raises',
    name: 'Підйоми на носки стоячи',
    muscle: 'legs',
    secondaryMuscles: [],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'lower_body',
    cameraView: 'back',
    cameraVerifierId: 'calf_raises',
    cameraTrackingSupported: true,
    description: 'Ізольований розвиток литкових та камбалоподібних мʼязів гомілки для стабільності стопи та стрибучості.',
    instructions: [
      'Станьте рівно, стопи на ширині таза, погляд спрямований уперед.',
      'Потужно підніміться на носки у максимальну верхню точку.',
      'Затримайте скорочення на 1 секунду та плавно опустіться на пʼяти.'
    ],
    duration: '45 сек',
    techniqueGood: [
      'Повна амплітуда руху в гомілковостопному суглобі',
      'Рівномірний тиск на подушечки великого та вказівного пальців стопи'
    ],
    techniqueBad: [
      'Пружинні безконтрольні ривки без фіксації у верхній точці',
      'Завалювання стопи на зовнішній край'
    ],
    repsGuide: '3-4 підходи по 20-30 повторень',
    xpPerRep: 8,
    demoType: 'video',
    youtubeId: 'gwLzBJYoWlI',
    tips: 'Для більшої амплітуди можна стати пальцями на підвищення (сходинку або брусок).'
  },
  // КОРПУС
  {
    id: 'elbow_plank',
    name: 'Планка на передпліччях (на ліктях)',
    muscle: 'abs',
    secondaryMuscles: ['shoulders', 'legs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    category: 'core',
    cameraView: 'side',
    cameraVerifierId: 'elbow_plank',
    cameraTrackingSupported: true,
    description: 'Класична жорстка планка на ліктях для максимального ізометричного навантаження на глибокий поперечний мʼяз преса.',
    instructions: [
      'Зіпріться на передпліччя, лікті строго під плечовими суглобами під кутом 90°.',
      'Напружте прес і підкрутіть таз назад, виключивши прогин у попереку.',
      'Дихайте ритмічно животом, зберігаючи струнку нерухому лінію тіла.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Постійна силова напруга у пресі та сідницях',
      'Плечі опущені від вух вниз'
    ],
    techniqueBad: [
      'Прогин і біль у поперековому відділі',
      'Задирання таза вище рівня плечей'
    ],
    repsGuide: '3 підходи по 45-60 секунд',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'pSHjTRCQxIw',
    tips: 'Під час виконання активно штовхайте підлогу ліктями від себе, щоб наповнити простір між лопатками.'
  },
  {
    id: 'side_plank',
    name: 'Бічна планка на лікті',
    muscle: 'abs',
    secondaryMuscles: ['shoulders'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    category: 'core',
    cameraView: 'front',
    cameraVerifierId: 'side_plank',
    cameraTrackingSupported: true,
    description: 'Акцентоване зміцнення косих мʼязів живота, бічних стабілізаторів та плечового поясу.',
    instructions: [
      'Ляжте на бік, зіпріться на передпліччя, лікоть розмістіть під плечем.',
      'Відірвіть таз від підлоги, вишикувавши тіло в одну пряму діагональну лінію.',
      'Утримуйте таз високо, не дозволяючи йому провисати до підлоги.'
    ],
    duration: '45 сек',
    techniqueGood: [
      'Верхня рука на поясі або витягнута вгору',
      'Грудна клітка відкрита, плече опорної руки стабільне'
    ],
    techniqueBad: [
      'Провисання таза донизу',
      'Скручування грудей або таза вперед до підлоги'
    ],
    repsGuide: '3 підходи по 30-45 секунд на кожен бік',
    xpPerRep: 12,
    demoType: 'video',
    youtubeId: 'K2VljzCC16g',
    tips: 'Стискайте нижній бік преса та сідниці для збереження стабільності лінії.'
  },
  // КАРДІО ТА ЗАГАЛЬНА ФІЗИЧНА ПІДГОТОВКА
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks (Стрибки з розведенням рук і ніг)',
    muscle: 'legs',
    secondaryMuscles: ['shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'cardio',
    cameraView: 'front',
    cameraVerifierId: 'jumping_jacks',
    cameraTrackingSupported: true,
    description: 'Динамічна кардіо-вправа для підвищення пульсу, координації кінцівок та спалювання калорій.',
    instructions: [
      'Початкове положення: ноги разом, руки опущені вздовж тулуба перед камерою.',
      'Легким стрибком розведіть ноги в сторони та зведіть долоні над головою.',
      'Мʼяко поверніться у вихідне положення та повторюйте в ритмічному темпі.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Мʼяке приземлення на передню частину стопи без гучного тупоту',
      'Легкий згин у колінах для амортизації'
    ],
    techniqueBad: [
      'Жорстке приземлення на прямі ноги та пʼяти',
      'Затримка дихання під час стрибків'
    ],
    repsGuide: '3-4 підходи по 45-60 секунд',
    xpPerRep: 8,
    demoType: 'video',
    youtubeId: 'UpH7rm0cYbM',
    tips: 'Тримайте прес у тонусі, а руки піднімайте через широку дугу з боків.'
  },
  {
    id: 'high_knees',
    name: 'Підйом колін (High Knees)',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'hybrid',
    location: 'home',
    difficulty: 'beginner',
    category: 'cardio',
    cameraView: 'front',
    cameraVerifierId: 'high_knees',
    cameraTrackingSupported: true,
    description: 'Високоінтенсивна кардіо-вправа для спалювання калорій, зміцнення ніг та активізації витривалості.',
    instructions: [
      'Встаньте прямо обличчям до камери, стопи на ширині тазу, лікті зігнуті перед собою.',
      'По черзі енергійно піднімайте коліна вгору до рівня тазу або вище.',
      'Приземляйтеся мʼяко на носки, зберігаючи пружний темп та рівне дихання.'
    ],
    duration: '45 сек',
    techniqueGood: [
      'Підйом коліна до паралелі стегна з підлогою (кут 90°)',
      'Мʼяке приземлення на носочки стоп без важкого удару пʼятами',
      'Активна координація рук і вертикальна постава'
    ],
    techniqueBad: [
      'Відхилення корпусу далеко назад під час підйому ніг',
      'Низький підйом колін без амплітуди',
      'Затримка дихання'
    ],
    repsGuide: '3-4 підходи по 30-45 секунд',
    xpPerRep: 8,
    demoType: 'video',
    youtubeId: 'Z1f_L4hGq34',
    youtubeTitle: 'Техніка High Knees для кардіо та витривалості',
    tips: 'Тримайте долоні на рівні поясу і намагайтеся торкатися їх колінами при кожному кроці.'
  },
  {
    id: 'burpees',
    name: 'Берпі (Burpees) вибухові',
    muscle: 'chest',
    secondaryMuscles: ['legs', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'advanced',
    category: 'general_conditioning',
    cameraView: 'side',
    cameraVerifierId: 'burpees',
    cameraTrackingSupported: true,
    description: 'Високоінтенсивна комплексна вправа для розвитку загальної сили, кардіо-витривалості та швидкості.',
    instructions: [
      'З положення стоячи швидко опустіться в присід і поставте долоні на підлогу.',
      'Стрибком перейдіть в упор лежачи та торкніться грудьми підлоги.',
      'Потужно відіжміться, підтягніть ноги до грудей і вистрибніть угору з оплеском над головою.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Синхронний вибуховий перехід між фазами',
      'Повне торкання підлоги грудьми та стегнами в нижній фазі',
      'Вертикальний стрибок угору з випрямленням у кульшових суглобах'
    ],
    techniqueBad: [
      'Неконтрольований удар животом об підлогу без амортизації',
      'Відсутність стрибка у фінальній фазі'
    ],
    repsGuide: '3-4 підходи по 10-15 повторень',
    xpPerRep: 15,
    demoType: 'video',
    youtubeId: 'dZgVxmf6jkA',
    tips: 'Знайдіть стабільний темп дихання: видих на вистрибуванні та вдих на падінні.'
  },
  {
    id: 'dynamic_warmup',
    name: 'Динамічна суглобова розминка',
    muscle: 'shoulders',
    secondaryMuscles: ['chest', 'back', 'legs', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'beginner',
    category: 'general_conditioning',
    cameraView: 'front',
    description: 'Комплексна підготовка сухожиль, звʼязок та суглобів перед силовими тренуваннями ForgeMuscle.',
    instructions: [
      'Виконайте колові рухи плечима, ліктями та запʼястками по 10 разів.',
      'Зробіть плавні нахили та скручування корпусу для активації хребта.',
      'Розігрійте тазостегнові, колінні та гомілковостопні суглоби легкими круговими рухами.'
    ],
    duration: '3-5 хв',
    techniqueGood: [
      'Плавні контрольовані амплітуди без різких ривків',
      'Глибоке рівне дихання'
    ],
    techniqueBad: [
      'Різкі балістичні махи на холодні звʼязки'
    ],
    repsGuide: '1 комплекс перед кожним тренуванням',
    xpPerRep: 5,
    demoType: 'video',
    youtubeId: 'IODxDxX7oi4',
    tips: 'Розминка знижує ризик спортивних травм на 80% і готує нервову систему до навантаження.'
  },
  {
    id: 'pullups_classic',
    name: 'Класичні підтягування на перекладині',
    muscle: 'back',
    secondaryMuscles: ['biceps', 'shoulders', 'abs'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    category: 'upper_body',
    cameraView: 'front',
    cameraVerifierId: 'pull_up',
    description: 'Головна верхова тяга в калістеніці для формування широкої V-подібної спини та сили хвата.',
    instructions: [
      'Візьміться за турнік прямим хватом трохи ширше плечей у повному висі.',
      'Опустіть лопатки вниз і потягніть груди до перекладини, підборіддя вище турніка.',
      'Плавно опустіться у вихідний вис без розгойдування та ривків.'
    ],
    duration: '60 сек',
    techniqueGood: [
      'Тяга за рахунок зведення лопаток та руху ліктів до боків',
      'Фіксація підборіддя над грифом перекладини',
      'Повне підконтрольне розгинання рук у нижній точці'
    ],
    techniqueBad: [
      'Дриґання ногами та кіпінг (ривки тілом)',
      'Неповна амплітуда (тяга лише до очей)',
      'Різке падіння вниз на розслаблені суглоби'
    ],
    repsGuide: '3-4 підходи по 6-12 повторень',
    xpPerRep: 15,
    demoType: 'video',
    youtubeId: 'eGo4IYlbE5g',
    tips: 'Уявіть, що ви тягнете лікті вниз до кишень, а не просто підтягуєте тіло вгору.'
  }
];

export interface ExerciseCategoryMeta {
  id: string;
  nameUk: string;
  description: string;
  iconName: string;
}

export const EXERCISE_CATEGORIES_META: ExerciseCategoryMeta[] = [
  { id: 'all', nameUk: 'Усі вправи', description: 'Повна база рухів ForgeMuscle', iconName: 'Sparkles' },
  { id: 'chest', nameUk: 'Груди (Chest)', description: 'Віджимання, бруси, жими', iconName: 'Shield' },
  { id: 'back', nameUk: 'Спина (Back)', description: 'Підтягування, тяги', iconName: 'Layers' },
  { id: 'legs', nameUk: 'Ноги (Legs)', description: 'Присідання, випади, литки', iconName: 'Compass' },
  { id: 'shoulders', nameUk: 'Плечі (Shoulders)', description: 'Жим, віджимання у стійці, пайк', iconName: 'Crosshair' },
  { id: 'arms', nameUk: 'Руки (Arms)', description: 'Біцепс, трицепс, діамантові віджимання', iconName: 'Zap' },
  { id: 'core', nameUk: 'Кор / Прес (Core)', description: 'Планка, скручування, підйоми ніг', iconName: 'Flame' },
  { id: 'cardio', nameUk: 'Full Body / Кардіо', description: 'Jumping Jacks, підйом колін, берпі', iconName: 'Activity' }
];

export function getExerciseCategory(ex: Exercise): string {
  if (ex.muscle === 'chest') return 'chest';
  if (ex.muscle === 'back') return 'back';
  if (ex.muscle === 'legs') return 'legs';
  if (ex.muscle === 'shoulders') return 'shoulders';
  if (ex.muscle === 'biceps' || ex.muscle === 'triceps') return 'arms';
  if (ex.muscle === 'abs') return 'core';
  if (ex.category === 'cardio' || ex.category === 'general_conditioning') return 'cardio';
  return 'cardio';
}

export function getExerciseCategoryTitle(catId: string): string {
  switch (catId) {
    case 'chest': return 'Груди';
    case 'back': return 'Спина';
    case 'legs': return 'Ноги';
    case 'shoulders': return 'Плечі';
    case 'arms': return 'Руки';
    case 'core': return 'Корпус / Прес';
    case 'cardio':
    case 'general_conditioning': return 'Full Body / Кардіо';
    case 'upper_body': return 'Верхня частина тіла';
    case 'lower_body': return 'Ноги';
    default: return 'Усі вправи';
  }
}

export function getCameraViewLabel(view?: 'front' | 'side' | 'back'): string {
  switch (view) {
    case 'front': return 'Спереду';
    case 'back': return 'Зі спини';
    case 'side':
    default:
      return 'Збоку';
  }
}

export function getExerciseInstructions(ex: Exercise): string[] {
  if (ex.instructions && ex.instructions.length > 0) {
    return ex.instructions;
  }
  if (ex.techniqueGood && ex.techniqueGood.length > 0) {
    return ex.techniqueGood.slice(0, 3);
  }
  return [
    'Займіть вихідне положення з контролем положення хребта.',
    'Виконайте робочий рух у повній амплітуді під контролем.',
    'Поверніться у вихідне положення з глибоким видихом.'
  ];
}

export function getExerciseDifficultyDisplay(difficulty: string): { label: string; color: string; level: 'easy' | 'medium' | 'hard' } {
  if (difficulty === 'easy' || difficulty === 'beginner') {
    return { label: 'Легка', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30', level: 'easy' };
  }
  if (difficulty === 'hard' || difficulty === 'advanced') {
    return { label: 'Висока', color: 'bg-red-950/60 text-red-400 border-red-500/30', level: 'hard' };
  }
  return { label: 'Середня', color: 'bg-amber-950/60 text-amber-400 border-amber-500/30', level: 'medium' };
}

export const MUSCLE_GROUPS_META: { id: Exercise['muscle']; nameUk: string; iconName: string }[] = [
  { id: 'chest', nameUk: 'Груди', iconName: 'Shield' },
  { id: 'back', nameUk: 'Спина', iconName: 'Layers' },
  { id: 'shoulders', nameUk: 'Плечі', iconName: 'Crosshair' },
  { id: 'biceps', nameUk: 'Біцепс', iconName: 'Zap' },
  { id: 'triceps', nameUk: 'Трицепс', iconName: 'Activity' },
  { id: 'legs', nameUk: 'Ноги', iconName: 'Compass' },
  { id: 'abs', nameUk: 'Прес / Кор', iconName: 'Flame' }
];

export const ANVIL_STAGES = [
  {
    stage: 'raw_metal' as const,
    name: 'Сирий метал (Raw Iron)',
    minXp: 0,
    maxXp: 250,
    description: 'Початок шляху. Метал холодний та грубий, але готовий до вогню перших тренувань.',
    badge: 'Новачок Кузні',
    perks: ['Відкриття базових вправ', 'Доступ до камера-трекера', 'Вибір напрямку'],
    color: '#71717a'
  },
  {
    stage: 'tempered_steel' as const,
    name: 'Загартована сталь (Tempered Steel)',
    minXp: 250,
    maxXp: 700,
    description: 'Удари молота сформували міцну структуру. Мʼязи відгукуються на кожне повторення.',
    badge: 'Атлет Сталі',
    perks: ['Підвищений множник XP (+10%)', 'Спеціальні програми Pro-Hub', 'Розширені челенджі'],
    color: '#38bdf8'
  },
  {
    stage: 'heavy_armor' as const,
    name: 'Важка броня (Heavy Armor)',
    minXp: 700,
    maxXp: 1500,
    description: 'Непробивний захист та нестримна міць. Ваша дисципліна загартована сотнями підходів.',
    badge: 'Лицар Заліза',
    perks: ['Вплив на результат Battle Mode x1.5', 'Доступ до елітних вправ', 'Золотий статус Арно'],
    color: '#f59e0b'
  },
  {
    stage: 'fiery_aura' as const,
    name: 'Вогняна аура (Fiery Inferno)',
    minXp: 1500,
    maxXp: 999999,
    description: 'Максимальний рівень коваля свого тіла. Ковадло палає вічним вогнем чистої могутності.',
    badge: 'Володар Кузні',
    perks: ['Легендарний статус у рейтингу', 'Подвійний вклад у битву', 'Повна повага Арно'],
    color: '#ea580c'
  }
];
