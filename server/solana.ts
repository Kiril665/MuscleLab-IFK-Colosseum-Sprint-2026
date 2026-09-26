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

export interface BattleProofData {
  proofHash: string;
  battleId: string;
  exercise: string;
  player1Wallet: string;
  player1Reps: number;
  player2Wallet: string;
  player2Reps: number;
  winnerId: string | 'draw';
  winnerReps: number;
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
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let result = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    result = BASE58_ALPHABET[remainder] + result;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    result = BASE58_ALPHABET[0] + result;
  }
  return result || BASE58_ALPHABET[0];
}

function base58Decode(value: string): Uint8Array {
  if (!value) return new Uint8Array();
  let number = 0n;
  for (const char of value) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit < 0) throw new Error('Invalid base58 value');
    number = number * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (number > 0n) {
    bytes.push(Number(number & 0xffn));
    number >>= 8n;
  }
  bytes.reverse();

  let leadingZeros = 0;
  while (leadingZeros < value.length && value[leadingZeros] === BASE58_ALPHABET[0]) leadingZeros++;
  return Uint8Array.from(new Array(leadingZeros).fill(0).concat(bytes));
}

function encodeShortVec(value: number): Buffer {
  const out: number[] = [];
  let remaining = value;
  do {
    let elem = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining !== 0) elem |= 0x80;
    out.push(elem);
  } while (remaining !== 0);
  return Buffer.from(out);
}

function readPrivateKeyBytes(raw: string): Uint8Array {
  const value = raw.trim();
  if (!value) throw new Error('SOLANA_VERIFIER_PRIVATE_KEY is empty');

  if (value.startsWith('[')) {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error('SOLANA_VERIFIER_PRIVATE_KEY JSON must be an array');
    const bytes = Uint8Array.from(parsed.map(Number));
    if (bytes.length !== 32 && bytes.length !== 64) throw new Error('Solana private key must contain 32 or 64 bytes');
    return bytes.slice(0, 32);
  }

  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return new Uint8Array(Buffer.from(value, 'hex'));
  }

  try {
    const bytes = new Uint8Array(Buffer.from(value, 'base64'));
    if (bytes.length === 32 || bytes.length === 64) return bytes.slice(0, 32);
  } catch {
    // Try base58 below.
  }

  const bytes = base58Decode(value);
  if (bytes.length !== 32 && bytes.length !== 64) throw new Error('Unsupported Solana private key format');
  return bytes.slice(0, 32);
}

function ed25519PrivateKey(seed: Uint8Array): crypto.KeyObject {
  const derPrefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  return crypto.createPrivateKey({ key: Buffer.concat([derPrefix, Buffer.from(seed)]), format: 'der', type: 'pkcs8' });
}

function ed25519PublicKey(seed: Uint8Array): Uint8Array {
  const privateKey = ed25519PrivateKey(seed);
  const der = crypto.createPublicKey(privateKey).export({ format: 'der', type: 'spki' }) as Buffer;
  return new Uint8Array(der.subarray(der.length - 32));
}

function buildMemoMessage(payer: Uint8Array, recentBlockhash: Uint8Array, memo: Buffer): Buffer {
  const programId = base58Decode(MEMO_PROGRAM_ID);
  if (payer.length !== 32 || recentBlockhash.length !== 32 || programId.length !== 32) {
    throw new Error('Invalid Solana account key length');
  }

  const header = Buffer.from([1, 0, 1]);
  const accountCount = encodeShortVec(2);
  const accounts = Buffer.concat([Buffer.from(payer), Buffer.from(programId)]);
  const instruction = Buffer.concat([
    Buffer.from([1]), // program id index = memo program
    encodeShortVec(0),
    encodeShortVec(memo.length),
    memo
  ]);

  return Buffer.concat([
    header,
    accountCount,
    accounts,
    Buffer.from(recentBlockhash),
    encodeShortVec(1),
    instruction
  ]);
}

/**
 * ForgeMuscle Solana proof bridge.
 *
 * Only compact hashes and Battle metadata are written to Solana.
 * Camera frames, video, biometrics and private user data never go on-chain.
 * A real transaction is considered successful only after Solana RPC confirmation.
 */
export class SolanaWorkoutProofService {
  private network: SolanaNetwork;
  private rpcUrl: string;
  private privateKey: string | null;

  constructor() {
    this.network = process.env.SOLANA_NETWORK === 'mainnet-beta' ? 'mainnet-beta' : 'devnet';
    this.rpcUrl = process.env.SOLANA_RPC_URL || (
      this.network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com'
    );
    this.privateKey = process.env.SOLANA_VERIFIER_PRIVATE_KEY || null;
  }

  public getNetwork(): SolanaNetwork { return this.network; }
  public getRpcUrl(): string { return this.rpcUrl; }
  public hasPrivateKey(): boolean { return Boolean(this.privateKey); }

  public getExplorerUrl(signature: string): string {
    return this.network === 'mainnet-beta'
      ? `https://explorer.solana.com/tx/${signature}`
      : `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }

  public async recordProof(proof: WorkoutProofData): Promise<SolanaRecordResult> {
    const memoContent = `FGM:1:${proof.proofHash}:${proof.validReps}:${proof.exercise}`;
    return this.broadcastMemoTransaction(memoContent);
  }

  public async recordBattleProof(proof: BattleProofData): Promise<SolanaRecordResult> {
    const memoContent = [
      'FGM:BATTLE:1',
      proof.proofHash,
      proof.battleId,
      proof.exercise,
      proof.player1Reps,
      proof.player2Reps,
      proof.winnerId === 'draw' ? 'draw' : proof.winnerId
    ].join(':');

    return this.broadcastMemoTransaction(memoContent);
  }

  private async rpc(method: string, params: unknown[]): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: `forge-${Date.now()}`, method, params }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`Solana RPC HTTP ${response.status}`);
    const data = await response.json() as any;
    if (data.error) throw new Error(data.error.message || `Solana RPC ${method} failed`);
    return data.result;
  }

  private async broadcastMemoTransaction(memo: string): Promise<SolanaRecordResult> {
    if (!this.privateKey) {
      return {
        success: false,
        network: this.network,
        signature: null,
        explorerUrl: null,
        memoContent: memo,
        isSimulated: false,
        error: 'Solana verifier wallet is not configured. Set SOLANA_VERIFIER_PRIVATE_KEY on the server.'
      };
    }

    try {
      const seed = readPrivateKeyBytes(this.privateKey);
      const payer = ed25519PublicKey(seed);
      const blockhashResult = await this.rpc('getLatestBlockhash', [{ commitment: 'confirmed' }]);
      const recentBlockhash = base58Decode(blockhashResult.value.blockhash);
      const message = buildMemoMessage(payer, recentBlockhash, Buffer.from(memo, 'utf8'));
      const signature = crypto.sign(null, message, ed25519PrivateKey(seed));

      const rawTransaction = Buffer.concat([
        encodeShortVec(1),
        signature,
        message
      ]);
      const signatureBase58 = base58Encode(new Uint8Array(signature));

      const sendResult = await this.rpc('sendTransaction', [
        rawTransaction.toString('base64'),
        { encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed' }
      ]);

      const txSignature = typeof sendResult === 'string' ? sendResult : signatureBase58;
      await this.rpc('confirmTransaction', [
        {
          blockhash: blockhashResult.value.blockhash,
          lastValidBlockHeight: blockhashResult.value.lastValidBlockHeight,
          signature: txSignature
        },
        'confirmed'
      ]);

      return {
        success: true,
        network: this.network,
        signature: txSignature,
        explorerUrl: this.getExplorerUrl(txSignature),
        memoContent: memo,
        isSimulated: false
      };
    } catch (err: any) {
      console.error('Solana memo transaction failed:', err);
      return {
        success: false,
        network: this.network,
        signature: null,
        explorerUrl: null,
        memoContent: memo,
        isSimulated: false,
        error: err?.message || 'Solana transaction failed'
      };
    }
  }
}

export const solanaService = new SolanaWorkoutProofService();
