import crypto from 'crypto';

export type SolanaNetwork = 'devnet' | 'mainnet-beta';

export interface WorkoutProofData {
  proofHash: string;
  athleteWallet: string;
  exercise: string;
  validReps: number;
  durationSeconds: number;
  serverSignature: string;
  timestamp: string;
}

export interface SolanaRecordResult {
  success: boolean;
  network: SolanaNetwork;
  signature: string | null;
  explorerUrl: string | null;
  memoContent?: string;
  error?: string;
  isSimulated?: boolean;
}

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

function decodeBase58(value: string): Buffer {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const char of value) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error('Invalid base58 private key');
    num = num * 58n + BigInt(index);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.push(Number(num & 255n));
    num >>= 8n;
  }
  bytes.reverse();
  let leading = 0;
  for (const char of value) {
    if (char === '1') leading++;
    else break;
  }
  return Buffer.concat([Buffer.alloc(leading), Buffer.from(bytes)]);
}

function encodeCompactU16(value: number): Buffer {
  const bytes: number[] = [];
  let n = value;
  while (n >= 0x80) {
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  bytes.push(n);
  return Buffer.from(bytes);
}

function encodeBase58(buffer: Buffer): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const byte of buffer) num = num * 256n + BigInt(byte);
  let out = '';
  while (num > 0n) {
    const rem = Number(num % 58n);
    out = alphabet[rem] + out;
    num /= 58n;
  }
  let leading = 0;
  for (const byte of buffer) {
    if (byte === 0) leading++;
    else break;
  }
  return '1'.repeat(leading) + (out || '');
}

function publicKeyToBuffer(publicKey: string): Buffer {
  const bytes = decodeBase58(publicKey);
  if (bytes.length !== 32) throw new Error('Invalid Solana public key');
  return bytes;
}

function getVerifierKey(): { seed: Buffer; publicKey: Buffer } | null {
  const raw = process.env.SOLANA_VERIFIER_PRIVATE_KEY;
  if (!raw) return null;

  let bytes: Buffer;
  if (raw.trim().startsWith('[')) {
    const parsed = JSON.parse(raw);
    bytes = Buffer.from(parsed);
  } else {
    bytes = decodeBase58(raw.trim());
  }

  if (bytes.length !== 32 && bytes.length !== 64) {
    throw new Error('SOLANA_VERIFIER_PRIVATE_KEY must be a 32-byte seed or 64-byte secret key');
  }

  const seed = bytes.subarray(0, 32);
  const publicKey = bytes.length === 64
    ? bytes.subarray(32, 64)
    : crypto.createPublicKey(createEd25519PrivateKey(seed)).export({ format: 'der', type: 'spki' }).subarray(-32);
  return { seed, publicKey };
}

function createEd25519PrivateKey(seed: Buffer): crypto.KeyObject {
  const pkcs8 = Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    seed
  ]);
  return crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
}

/**
 * Real Solana memo attestation service.
 * No synthetic transaction signatures are generated. If the verifier key is not
 * configured, recording fails clearly instead of pretending a transaction exists.
 */
export class SolanaWorkoutProofService {
  private network: SolanaNetwork;
  private rpcUrl: string;
  private verifierKey: { seed: Buffer; publicKey: Buffer } | null;

  constructor() {
    this.network = process.env.SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
    this.rpcUrl = process.env.SOLANA_RPC_URL || (
      this.network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com'
    );
    this.verifierKey = getVerifierKey();
  }

  public getNetwork(): SolanaNetwork { return this.network; }
  public getRpcUrl(): string { return this.rpcUrl; }
  public hasPrivateKey(): boolean { return !!this.verifierKey; }

  public getExplorerUrl(signature: string): string {
    return this.network === 'mainnet-beta'
      ? `https://explorer.solana.com/tx/${signature}`
      : `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }

  public getStatus() {
    return {
      network: this.network,
      rpcUrl: this.rpcUrl,
      configured: this.hasPrivateKey(),
      simulated: false
    };
  }

  public async recordProof(proof: WorkoutProofData): Promise<SolanaRecordResult> {
    if (!this.verifierKey) {
      return {
        success: false,
        network: this.network,
        signature: null,
        explorerUrl: null,
        error: 'Solana verifier is not configured. Set SOLANA_VERIFIER_PRIVATE_KEY on the server.',
        isSimulated: false
      };
    }

    const memoContent = `FGM:1:${proof.proofHash}:${proof.validReps}:${proof.exercise}`;
    try {
      const result = await this.broadcastMemoTransaction(memoContent);
      if (!result.signature) {
        return {
          success: false,
          network: this.network,
          signature: null,
          explorerUrl: null,
          memoContent,
          error: result.error || 'Solana transaction failed',
          isSimulated: false
        };
      }

      return {
        success: true,
        network: this.network,
        signature: result.signature,
        explorerUrl: this.getExplorerUrl(result.signature),
        memoContent,
        isSimulated: false
      };
    } catch (error: any) {
      return {
        success: false,
        network: this.network,
        signature: null,
        explorerUrl: null,
        memoContent,
        error: error?.message || 'Solana transaction failed',
        isSimulated: false
      };
    }
  }

  private async rpc(method: string, params: any[]) {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Solana RPC HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'Solana RPC error');
    return data.result;
  }

  private async broadcastMemoTransaction(memo: string): Promise<{ signature?: string; error?: string }> {
    const key = this.verifierKey!;
    const latest = await this.rpc('getLatestBlockhash', [{ commitment: 'confirmed' }]);
    const blockhash = decodeBase58(latest.value.blockhash);
    const feePayer = key.publicKey;
    const memoProgram = publicKeyToBuffer(MEMO_PROGRAM_ID);
    const memoBytes = Buffer.from(memo, 'utf8');

    const message = Buffer.concat([
      Buffer.from([1, 0, 1]),
      encodeCompactU16(2),
      feePayer,
      memoProgram,
      blockhash,
      encodeCompactU16(1),
      Buffer.from([1]),
      Buffer.from([0]),
      encodeCompactU16(memoBytes.length),
      memoBytes
    ]);

    const signature = crypto.sign(null, message, createEd25519PrivateKey(key.seed));
    const transaction = Buffer.concat([
      encodeCompactU16(1),
      signature,
      message
    ]);

    const txSignature = await this.rpc('sendTransaction', [transaction.toString('base64'), {
      encoding: 'base64',
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    }]);

    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const statuses = await this.rpc('getSignatureStatuses', [[txSignature], { searchTransactionHistory: true }]);
      const status = statuses.value?.[0];
      if (status?.err) return { error: `Solana transaction rejected: ${JSON.stringify(status.err)}` };
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        return { signature: txSignature };
      }
      await new Promise(resolve => setTimeout(resolve, 700));
    }
    return { error: `Solana transaction submitted but not confirmed within 10 seconds: ${txSignature}` };
  }
}

