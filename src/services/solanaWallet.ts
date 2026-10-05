import bs58 from 'bs58';

type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void>;
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array } | Uint8Array>;
  sendTransaction?: (transaction: any, connection: any, options?: any) => Promise<string>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
};

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
  }
}

export function getSolanaProvider(): SolanaProvider | null {
  if (typeof window === 'undefined') return null;
  return window.phantom?.solana || window.solflare || window.solana || null;
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export async function connectSolanaWallet(): Promise<string> {
  const provider = getSolanaProvider();
  if (!provider) {
    throw new Error('Встановіть Phantom або Solflare та відкрийте ForgeMuscle у браузері гаманця.');
  }

  const result = await provider.connect();
  const address = result.publicKey.toString();

  const challengeResponse = await fetch('/api/solana/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  const challenge = await challengeResponse.json();
  if (!challengeResponse.ok) throw new Error(challenge.error || 'Не вдалося створити challenge.');

  const signed = await provider.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
  const rawSignature = (signed as any)?.signature ?? signed;
  const signature = typeof rawSignature === 'string'
    ? rawSignature
    : bs58.encode(rawSignature instanceof Uint8Array ? rawSignature : new Uint8Array(rawSignature));

  const linkResponse = await fetch('/api/solana/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce: challenge.nonce, address, signature }),
  });
  const linked = await linkResponse.json();
  if (!linkResponse.ok) throw new Error(linked.error || 'Не вдалося прив’язати гаманець.');

  return address;
}

export async function disconnectSolanaWallet(): Promise<void> {
  const provider = getSolanaProvider();
  await provider?.disconnect?.();
  await fetch('/api/solana/unlink', { method: 'POST' });
}
