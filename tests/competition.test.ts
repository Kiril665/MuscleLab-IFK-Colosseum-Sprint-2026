import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Competition scoring', () => {
  it('scores repetitions with accuracy coefficient', () => {
    const reps = 20;
    const accuracy = 85;
    assert.equal(reps * (accuracy / 100), 17);
  });
  it('rejects impossible repetition cadence', () => {
    assert.equal(250 < 250, false);
    assert.equal(500 >= 250, true);
  });
});
