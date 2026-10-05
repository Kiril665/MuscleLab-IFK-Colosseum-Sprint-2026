# ForgeMuscle — Кузня Твого Тіла

ForgeMuscle — веб-застосунок (mobile-first), який поєднує наукове навчання новачків із захопливим гейміфікованим тренуванням перед розумною ШІ-камерою та 60-секундними дуелями.

Головна концепція: **«Навчись → Зроби → Переможи → Прокачай акаунт»**.

---

## 🎨 Брендинг та дизайн-система

Брендинг повністю випливає з офіційного логотипа ForgeMuscle (два атлети-титани, ковадло з короною, важкі залізні ланцюги та розпечена лава).

### Знайдена палітра (HEX-коди)
| Елемент | Значення | Опис |
|---|---|---|
| **Pitch Cast Iron (Фон)** | `#0B0D11` | Глибокий темний колір литого заліза |
| **Dark Forge Surface (Картки)** | `#13171F` | Поверхня кованих металевих блоків |
| **Elevated Surface (Ховер/підняті)** | `#1B212D` | Активні та інтерактивні шари |
| **Chiseled Border (Рамки)** | `#283244` | Тонкі металеві грані заліза |
| **Molten Ember (Головний акцент)** | `#FF6B00` | Розпечений метал / лава логотипа |
| **Ember Core (Підсвічування)** | `#FFA31A` | Яскрава серцевина вогню |
| **Crown Gold (XP та нагороди)** | `#FFB800` | Золото корони та досягнень |
| **Forge Spark (Успіх)** | `#10B981` | Смарагдова іскра (успішний повтор) |
| **Crimson Heat (Помилка)** | `#EF4444` | Багряний колір детекції помилок |
| **Chiseled Text (Текст основний)** | `#F8FAFC` | Чистий світлий відтінок металу |
| **Slate Steel (Текст вторинний)** | `#94A3B8` | Стриманий сталевий сірий |

### Світла тема та WCAG AA контраст
У світлій темі (`:root`) акцентний колір оптимізовано до `#D95200` для забезпечення коефіцієнта контрастності понад **4.5:1** (WCAG AA). Сам логотип обрамляється круглою темною плашкою для максимальної контрастності на світлому фоні.

### Шрифти
- **Заголовки, логотип та великі цифри:** `Russo One` / `Chakra Petch` (Google Fonts) — монументальний рубаний стиль, що повторює 3D-гравіювання «FORGEMUSCLE».
- **Тіло, навігація та текст карток:** `Plus Jakarta Sans` / `Inter` (Google Fonts) — максимальна читабельність на мобільних пристроях.

### Де змінити токени
Усі токени стилю, кольорів та радіусів зосереджені в єдиному файлі:
- `src/index.css` (CSS variables `--bg-base`, `--bg-card`, `--accent`, `--border-subtle`, тощо).

---

## 🏗️ Архітектура додатку

1. **Фронтенд:**
   - React 19, TypeScript, Tailwind CSS v4, Motion, Lucide Icons, Canvas Confetti.
   - PWA-підтримка з повним набором іконок (192, 512, maskable) та `manifest.webmanifest`.
   - Автоматичне визначення регіону й мови (`uk`, `en`, `pl`) за замовчуванням без блокування старту.

2. **Комп’ютерний зір (MediaPipe Pose):**
   - `@mediapipe/tasks-vision` із завантаженням моделі `pose_landmarker_lite`.
   - Локальна обробка на пристрої (WASM + WebGL/GPU-delegate із CPU-fallback).
   - Експоненційне згладжування координат суглобів (`PointFilterEMA`) для стабільності на мобільних телефонах.
   - Детерміновані автомати станів з кутовою геометрією для кожної вправи (відтискання, присідання, підтягування, стрибки, випади, планка, бруси).
   - **Приватність:** відеокадри ніколи не зберігаються та не відправляються на сервер — передаються виключно скалярні метрики (повтор, ROM %, точність, nonce).

3. **Бекенд та база даних:**
   - `server.ts` (Express + `ws` WebSocketServer на порту 3000).
   - База даних: SQLite на `node:sqlite` (`DatabaseSync`), спроєктована за стандартами реляційних БД для миттєвої міграції на PostgreSQL.
   - Авторизація через Email + Пароль (криптографічний `scrypt` з унікальною сіллю) або серверний гостьовий акаунт. Гостьовий прогрес зберігається в SQLite через сесію.
   - Сесії: захищені `httpOnly` + `SameSite=Lax` cookie, перелік активних сесій, кнопка «Вийти з усіх пристроїв».
   - Захист від брутфорсу: ліміт 5 невдалих спроб на 15 хвилин для акаунта й для IP.
   - Серверна верифікація результатів: одноразовий nonce (anti-replay), контроль темпу та аномалій.

---

## 🚀 Запуск проєкту

### 1. Встановлення залежностей
```bash
npm install
```

### 2. Запуск у режимі розробки
```bash
npm run dev
```
Сервер запуститься на `http://localhost:3000` з інтегрованим Vite як Express-middleware.

### 3. Збірка для продакшену
```bash
npm run build
npm start
```

### 4. Запуск юніт-тестів
```bash
npm test
```
Запускає синтетичні тести валідації повторів за геометрією скелета та перевірку консистентності словників локалізації.

---

## 🔑 Змінні середовища (`.env`)

Скопіюйте приклад `.env.example` у свій `.env`. Авторизація працює через email/пароль або гостьову сесію; зовнішній OAuth не використовується.

```bash
GEMINI_API_KEY="..."
SESSION_SECRET="довгий випадковий секрет"
STUN_SERVER="stun:stun.l.google.com:19302"
TURN_SERVER=""
TURN_USERNAME=""
TURN_CREDENTIAL=""
SOLANA_CLUSTER="devnet"
# SOLANA_RPC_URL="https://api.devnet.solana.com"
DATABASE_PATH="./forgemuscle.sqlite"
```


## ▶️ Запуск

Потрібен Node.js 22.16+ (проєкт використовує `node:sqlite`). Після клонування/розпакування виконайте `npm install`, потім `npm run dev`. Команда dev-запуску не залежить від локального бінарника `tsx`: сервер запускається через вбудований TypeScript strip-types Node.js.

## 🔐 Авторизація та гості

Доступні Email + пароль і «Грати як гість». Гість має реальний серверний запис, 30-денну httpOnly-сесію та серверний прогрес. Вихід із гостьового акаунта незворотно видаляє його дані; для збереження прогресу потрібно створити звичайний акаунт.

## 🏆 Змагання

ForgeMuscle має асинхронні 60-секундні змагання на вправи. Сервер видає одноразовий nonce, перевіряє темп повторів, рахує score на сервері та веде leaderboard. Щоденні змагання генеруються для вправ, а також створюється щотижневе велике змагання. Топ-3 отримують XP і монети.

## 🎙️ Голосовий чат

Голос працює через WebRTC mesh: SDP/ICE проходять через єдиний `/ws`, а STUN/TURN налаштовуються через `.env`. Для бою використовується окрема кімната, після завершення матчу з’єднання закривається.

## 🟣 Solana

Solana використовується лише як підтвердження зовнішнього гаманця. Приватні ключі не зберігаються, переказів, токенів та NFT немає. За замовчуванням використовується devnet.

## 📱 Обмеження та рекомендації для камери

1. **Освітлення:** Уникайте яскравого світла прямо позаду себе (контрове світло від вікна). Джерело світла має падати на ваше обличчя та торс.
2. **Ракурс:** Встановіть смартфон на висоті 50–90 см від підлоги на стабільну опору з легким нахилом назад.
3. **iOS Safari:** Для коректної роботи обов’язково надайте дозвіл на доступ до камери при першому запиті у спливаючому діалозі Safari.


## Mobile testing
Camera, microphone, WebRTC and wallet integrations require HTTPS on mobile. Use an HTTPS tunnel and open the resulting URL in Chrome Android or Safari iOS. The PWA service worker bypasses `/api/` and `/ws`.

## Solana
Default network is devnet. Desktop uses an injected wallet provider. Mobile users should open ForgeMuscle inside Phantom/Solflare or use their supported deep-link/in-app-browser flow.


## Camera pipeline and safety

- Camera counting uses image + world landmarks, adaptive smoothing, view-quality gating and server-authoritative rep acknowledgements.
- MediaPipe assets are prepared locally by `npm run prepare:mediapipe`; CDN remains a fallback when local assets are unavailable.
- Real-money staking remains disabled by default (`ENABLE_REAL_MONEY=false`). A production real-money launch requires legal/compliance review, age verification/KYC and security/audit work.
- Monocular 3D pose is approximate; when confidence is low the counter pauses rather than inventing repetitions.
