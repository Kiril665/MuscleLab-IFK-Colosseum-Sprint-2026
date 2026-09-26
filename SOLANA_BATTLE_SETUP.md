# ForgeMuscle Battle — Solana proof setup

Battle settlement now supports a real Solana Memo proof on the server.

## What is written on-chain

Only compact Battle proof metadata is written:

- proof hash
- Battle ID
- confirmed Exercise ID
- verified result counters used by settlement
- winner identifier

Camera frames, video, skeleton/biometric coordinates, passwords, emails and private user data are never sent to Solana.

## Server configuration

Set these variables in the server environment. Never put the private key in frontend code or commit a real `.env` file.

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_VERIFIER_PRIVATE_KEY=YOUR_SERVER_ONLY_SOLANA_PRIVATE_KEY
```

The private key can be supplied as a 32/64-byte JSON array, base64, hex, or base58 secret key. The server derives the Ed25519 public key and signs the Memo transaction locally.

## Behaviour

- With a configured signer: the server broadcasts and confirms a real Solana transaction.
- Without a configured signer: Battle settlement remains off-chain and the UI explicitly says that no Solana proof was recorded.
- The application never displays a synthetic transaction signature as a successful on-chain transaction.
- Explorer links are returned only when a real transaction signature has been confirmed.

## Network

Use `devnet` while testing. Switch to `mainnet-beta` only when the server signer and RPC configuration are intentionally prepared for production.
