# ForgeMuscle Solana setup

ForgeMuscle uses Solana for cryptographic workout attestations. The application does not generate fake transaction signatures.

## Environment

```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_VERIFIER_PRIVATE_KEY=<base58 32-byte seed or 64-byte secret key>
```

`SOLANA_VERIFIER_PRIVATE_KEY` is server-only. Never expose it to the browser and never commit the real value.

The verifier wallet pays the transaction fee and writes a compact ForgeMuscle memo containing the workout proof hash. Raw camera frames, pose landmarks and biometric data are not written to Solana.

## Wallet

The Forge Passport wallet control uses an injected Solana wallet provider (for example Phantom or Solflare). The wallet public key is used as the athlete wallet address; private keys remain inside the wallet.

## Behavior when Solana is not configured

Workout verification can still be evaluated by the server, but no blockchain transaction is claimed. The API returns a clear Solana configuration/attestation error instead of a fabricated signature or Explorer link.

## Production checklist

- Use `mainnet-beta` only with a funded production verifier wallet.
- Keep the verifier private key in the deployment secret manager.
- Use an authenticated ForgeMuscle session for verifier endpoints.
- Never store seed phrases/private keys in localStorage.
- Never put raw camera/video/pose telemetry on-chain.
