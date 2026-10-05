# ForgeMuscle Solana Payments

Wallet linking and payment verification are separate systems.

## Required environment

```env
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=
SOLANA_MERCHANT_WALLET=
SOLANA_USDC_MINT=
FORGEMUSCLE_PREMIUM_USDC=9.99
FORGEMUSCLE_PREMIUM_SOL=0.05
```

Use a test/devnet token mint in development. For production, switch the cluster to `mainnet-beta`, configure the production merchant wallet and the exact production token mint, and use a reliable RPC provider.

## Flow

1. `POST /api/payments/orders` creates a server-priced order.
2. The server creates a unique Solana Pay reference.
3. The server returns a `solana:` payment URL.
4. The wallet signs/sends the transaction.
5. The client submits the transaction signature to `/api/payments/orders/:id/verify`.
6. The server reads the transaction from Solana RPC and checks order reference, recipient, amount, currency/mint, confirmation status and transaction uniqueness.
7. Only then is the order marked `PAID` and the entitlement activated.

Never put `SOLANA_MERCHANT_WALLET` or secret keys in frontend code. Never accept a frontend `paid=true` flag as proof of payment.

The implementation follows the Solana Pay transfer-request model with an order-specific `reference`. See the official Solana payment documentation for production readiness and current SDK options.

## Як користувач підключає гаманець

1. Створіть акаунт ForgeMuscle і увійдіть у нього.
2. Встановіть Phantom або Solflare. Seed phrase/private key ForgeMuscle ніколи не запитує.
3. Відкрийте ForgeMuscle у браузері з встановленим wallet extension або відкрийте сайт у mobile wallet browser.
4. У профілі натисніть **Підключити**.
5. Wallet попросить дозвіл на підключення — підтвердьте його.
6. ForgeMuscle покаже verification message. Підпис повідомлення підтверджує володіння адресою; це **не переказ коштів**.
7. Сервер перевіряє підпис і прив'язує public wallet address до акаунта.
8. Після цього у профілі буде видно скорочену адресу, баланс SOL і мережу.

### Що потрібно налаштувати власнику ForgeMuscle

- `SOLANA_CLUSTER=devnet` для першого тестування.
- `SOLANA_RPC_URL` — RPC endpoint відповідної мережі.
- `SOLANA_MERCHANT_WALLET` — public merchant address для дозволених покупок.
- `SOLANA_USDC_MINT` — точний mint потрібного USDC/SPL token для обраної мережі.
- `FORGEMUSCLE_PREMIUM_USDC` та `FORGEMUSCLE_PREMIUM_SOL` — ціни, які контролює сервер.

Для production використовуй HTTPS і `mainnet-beta` лише після окремої перевірки merchant wallet, token mint, RPC та платіжної конфігурації.

### Важливо

Wallet connection — це ідентифікація власника public address. Він не є доказом оплати. Оплата Premium проходить окремим server-side verification flow. Сервер також перевіряє, що transaction signer відповідає прив'язаному wallet, перед активацією entitlement.

## Donations

The app also exposes `POST /api/payments/donations` for voluntary SOL/USDC donations. Donation orders use the same server-side verification flow but do not grant Premium or any other entitlement. Configure `SOLANA_MERCHANT_WALLET` to the wallet that should receive donations.


### Donation configuration

The donation feature does not require a separate merchant account. Set `SOLANA_MERCHANT_WALLET` to the **public address of the wallet you control**. Do not put a seed phrase or private key in `.env`.

For the first test, keep `SOLANA_CLUSTER=devnet` and use a test wallet. For real donations, use `mainnet-beta` only after verifying the recipient wallet and token mint yourself.



## Local development command

Use:

```bash
npm install
npm run dev
```

The project uses `tsx server.ts`. Do not replace it with `node --experimental-strip-types server.ts`, because the server imports extensionless TypeScript modules such as `server/db`.

## Потік оплати після виправлення

Кнопка Premium спочатку підключає Phantom/Solflare та проходить server-side wallet verification. Після успішної прив'язки ForgeMuscle створює замовлення із серверною ціною та унікальним `reference`, після чого гаманець підписує переказ SOL або USDC. Сервер не приймає повідомлення від frontend як доказ оплати: він сам читає транзакцію через Solana RPC та перевіряє reference, одержувача, суму, token mint і гаманець платника.

Solana Pay використовує `reference` для прив'язки on-chain транзакції до конкретного замовлення; це відповідає офіційній специфікації Solana Pay. 

## Поточна тестова адреса

Проєкт уже містить public merchant wallet:
`4B3CdpxEqBF5f9QdC92Y1zhydusKdHV3kqXPApAHQLAE`

Вона використовується тільки як адреса отримувача. Seed phrase/private key у проєкті відсутні.
