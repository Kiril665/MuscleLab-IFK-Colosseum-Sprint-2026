export interface SolanaWalletProvider {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toString(): string } | null;
  connect: () => Promise<{ publicKey?: { toString(): string } } | void>;
  disconnect?: () => Promise<void> | void;
  signMessage?: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array } | Uint8Array>;
}

declare global {
  interface Window {
    solana?: SolanaWalletProvider;
    solflare?: SolanaWalletProvider;
  }
}

export function getSolanaWalletProvider(): SolanaWalletProvider | null {
  if (typeof window === 'undefined') return null;
  return window.solana || window.solflare || null;
}

export async function connectSolanaWallet(): Promise<string> {
  const provider = getSolanaWalletProvider();
  if (!provider) {
    throw new Error('Solana wallet не знайдено. Встановіть Phantom або Solflare.');
  }
  const result = await provider.connect();
  const publicKey = provider.publicKey || (result && result.publicKey);
  const address = publicKey?.toString();
  if (!address) throw new Error('Wallet не повернув public key.');
  return address;
}

export async function disconnectSolanaWallet(): Promise<void> {
  const provider = getSolanaWalletProvider();
  if (provider?.disconnect) await provider.disconnect();
}
