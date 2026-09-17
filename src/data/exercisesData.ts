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
    tips: 'Контролюйте опускання 2 секунди, виштовхуйтесь потужно за 1 секунду.'
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
    tips: 'Для більшого включення грудей зведіть підборіддя до грудей і зігніть коліна вперед.'
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
    tips: 'Якщо важко, почніть виконувати з опорою колінами на підлогу.'
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
    tips: 'Уявіть, що ви тягнете лікті до кишень, а не підтягуєте себе руками.'
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
    tips: 'Чим нижче перекладина до підлоги, тим вища складність вправи.'
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
    tips: 'Використовуйте мʼяку подушку або блок під голову під час вивчення.'
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
    tips: 'Ставте стопи на узвишшя (стілець чи лаву) для підвищення навантаження.'
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
    tips: 'Стискайте біцепси щосили в максимальній верхній точці 1 секунду.'
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
    name: 'Діамантові віджимання (Diamond Push-ups)',
    muscle: 'triceps',
    secondaryMuscles: ['chest', 'shoulders'],
    discipline: 'calisthenics',
    location: 'home',
    difficulty: 'intermediate',
    description: 'Максимальне фокусування на латеральній та довгій голівках трицепса без жодного заліза.',
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
    tips: 'Створіть внутрішньочеревний тиск (маневр Вальсальви) перед кожним повторенням.'
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
    tips: 'Тримайтеся за стійку або петлю TRX під час освоєння рівноваги.'
  },
  {
    id: 'bulgarian_split_squats',
    name: 'Болгарські спліт-присідання',
    muscle: 'legs',
    secondaryMuscles: ['abs'],
    discipline: 'hybrid',
    location: 'home',
    difficulty: 'intermediate',
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
    tips: 'Якщо прямі ноги поки важко, почніть із підйому зігнутих у колінах ніг до грудей.'
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
    name: 'Скручування пресу з фіксацією піку',
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
    tips: 'Тримайте пальці біля скронь або схрещеними на грудях, не зчіплюйте в замок на потилиці.'
  }
];

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
