import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  PublicKey,
  sendAndConfirmTransaction
} from '@solana/web3.js';

export type SolanaNetwork = 'devnet' | 'mainnet-beta';

export interface WorkoutProofData {
  battleId?: string;
  proofHash: string;
  athleteWallet?: string;
  exercise: string;
  validReps: number;
  durationSeconds?: number;
  serverSignature?: string;
  timestamp?: string;
}

export interface SolanaRecordResult {
  success: boolean;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED' | 'NOT_CONFIGURED';
  network: SolanaNetwork;
  signature: string | null;
  explorerUrl: string | null;
  memoContent?: string;
  error?: string;
  settledAt?: string;
}

// SPL Memo Program v2 ID
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Solana Verifier Bridge for ForgeMuscle
 * 
 * Strict Blockchain Guarantees:
 * 1. Server-side isolation: Private keys never leak to frontend.
 * 2. Privacy: Only minimal cryptographic proof hashes & battle IDs are notarized; raw video/biometrics are NEVER stored on-chain.
 * 3. Network separation: Devnet vs Mainnet-beta explicit cluster configuration.
 * 4. Honesty & Anti-Fake: Never output fake transaction signatures or fake explorer links. If RPC or key is not set, explicitly returns NOT_CONFIGURED.
 * 5. Idempotent settlement: One battleId + proofHash produces at most one blockchain record.
 */
export class SolanaWorkoutProofService {
  private network: SolanaNetwork;
  private rpcUrl: string;
  private privateKeyStr: string | null;
  private keypair: Keypair | null = null;
  private connection: Connection | null = null;
  // Idempotency cache: (battleId + ':' + proofHash) -> SolanaRecordResult
  private settlementCache = new Map<string, SolanaRecordResult>();

  constructor() {
    this.network = (process.env.SOLANA_NETWORK === 'mainnet-beta') ? 'mainnet-beta' : 'devnet';
    this.rpcUrl = process.env.SOLANA_RPC_URL || (
      this.network === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com'
        : 'https://api.devnet.solana.com'
    );
    this.privateKeyStr = process.env.SOLANA_VERIFIER_PRIVATE_KEY?.trim() || null;
    this.initKeypair();
  }

  private initKeypair() {
    if (!this.privateKeyStr) return;
    try {
      this.connection = new Connection(this.rpcUrl, 'confirmed');

      // Check if JSON array: [1,2,3...]
      if (this.privateKeyStr.startsWith('[') && this.privateKeyStr.endsWith(']')) {
        const raw = JSON.parse(this.privateKeyStr);
        this.keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
      } else if (this.privateKeyStr.length === 128) {
        // Hex encoded 64-byte key
        const raw = Buffer.from(this.privateKeyStr, 'hex');
        this.keypair = Keypair.fromSecretKey(raw);
      } else {
        // Base58 encoded
        // Use basic base58 decode if bs58 is available or decode standard bytes
        const decoded = this.decodeBase58(this.privateKeyStr);
        if (decoded && decoded.length === 64) {
          this.keypair = Keypair.fromSecretKey(decoded);
        }
      }
    } catch (err) {
      console.warn('[SolanaService] Could not parse SOLANA_VERIFIER_PRIVATE_KEY:', (err as Error).message);
      this.keypair = null;
    }
  }

  private decodeBase58(str: string): Uint8Array | null {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = [0];
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const val = ALPHABET.indexOf(c);
      if (val < 0) return null;
      for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
      bytes[0] += val;
      let carry = 0;
      for (let j = 0; j < bytes.length; j++) {
        bytes[j] += carry;
        carry = bytes[j] >> 8;
        bytes[j] &= 0xff;
      }
      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let i = 0; i < str.length && str[i] === '1'; i++) bytes.push(0);
    return new Uint8Array(bytes.reverse());
  }

  public getNetwork(): SolanaNetwork {
    return this.network;
  }

  public getRpcUrl(): string {
    return this.rpcUrl;
  }

  public isConfigured(): boolean {
    return Boolean(this.keypair);
  }

  public getVerifierPublicKey(): string | null {
    return this.keypair ? this.keypair.publicKey.toBase58() : null;
  }

  /**
   * Generates public explorer link depending on network cluster
   */
  public getExplorerUrl(signature: string): string {
    if (this.network === 'mainnet-beta') {
      return `https://explorer.solana.com/tx/${signature}`;
    }
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }

  /**
   * Records workout / battle cryptographic proof on Solana
   * Idempotent: same (battleId + proofHash) returns existing result without broadcasting duplicate.
   */
  public async recordProof(proof: WorkoutProofData): Promise<SolanaRecordResult> {
    const safeRef = (proof.proofHash || '').slice(0, 16);
    const safeBattleId = proof.battleId || 'battle_' + safeRef;
    const memoContent = `FGM:BATTLE:1 battle=${safeBattleId} ex=${proof.exercise} proof=${safeRef} reps=${proof.validReps}`;
    const cacheKey = `${safeBattleId}:${safeRef}`;

    // 1. Idempotency check: if already confirmed for this battle + proof, return cached
    const cached = this.settlementCache.get(cacheKey);
    if (cached && cached.status === 'CONFIRMED') {
      return cached;
    }

    // 2. If no valid Solana verifier private key is set on the server, report honest NOT_CONFIGURED status.
    // Strictly per specification: never return fake signature or fake explorer link.
    if (!this.keypair || !this.connection) {
      const notConfiguredResult: SolanaRecordResult = {
        success: false,
        status: 'NOT_CONFIGURED',
        network: this.network,
        signature: null,
        explorerUrl: null,
        memoContent,
        error: 'Solana Verifier key not configured on server (SOLANA_VERIFIER_PRIVATE_KEY is empty or invalid)',
        settledAt: new Date().toISOString()
      };
      this.settlementCache.set(cacheKey, notConfiguredResult);
      return notConfiguredResult;
    }

    // 3. Broadcast real SPL Memo transaction signed by verifier keypair
    try {
      const instruction = new TransactionInstruction({
        keys: [{ pubkey: this.keypair.publicKey, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoContent, 'utf-8')
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = this.keypair.publicKey;

      const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;

      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair],
        { commitment: 'confirmed', maxRetries: 3 }
      );

      const confirmedResult: SolanaRecordResult = {
        success: true,
        status: 'CONFIRMED',
        network: this.network,
        signature,
        explorerUrl: this.getExplorerUrl(signature),
        memoContent,
        settledAt: new Date().toISOString()
      };

      this.settlementCache.set(cacheKey, confirmedResult);
      return confirmedResult;
    } catch (err: any) {
      console.error('[SolanaService] Transaction broadcast error:', err?.message);
      const failedResult: SolanaRecordResult = {
        success: false,
        status: 'FAILED',
        network: this.network,
        signature: null,
        explorerUrl: null,
        memoContent,
        error: err?.message || 'Solana RPC broadcast failed to confirm',
        settledAt: new Date().toISOString()
      };
      // Allow retry on future attempts by not permanently locking as confirmed
      return failedResult;
    }
  }
}

export const solanaService = new SolanaWorkoutProofService();
