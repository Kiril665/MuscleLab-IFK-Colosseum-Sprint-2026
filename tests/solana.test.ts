import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import nacl from 'tweetnacl';

describe('Solana-style wallet challenge signatures', () => {
  it('accepts a valid detached signature and rejects a changed message', () => {
    const kp = nacl.sign.keyPair();
    const message = new TextEncoder().encode('ForgeMuscle wallet verification\nNonce: test');
    const signature = nacl.sign.detached(message, kp.secretKey);
    assert.equal(nacl.sign.detached.verify(message, signature, kp.publicKey), true);
    assert.equal(nacl.sign.detached.verify(new TextEncoder().encode('tampered'), signature, kp.publicKey), false);
  });
});
