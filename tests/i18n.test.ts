import { describe, it } from 'node:test';
import assert from 'node:assert';
import { translations } from '../src/services/i18n';

function extractKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(extractKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe('i18n Consistency Tests', () => {
  it('ensures uk, en, pl, de, fr, and es dictionaries have identical keys', () => {
    const ukKeys = extractKeys(translations.uk);
    const enKeys = extractKeys(translations.en);
    const plKeys = extractKeys(translations.pl);
    const deKeys = extractKeys(translations.de);
    const frKeys = extractKeys(translations.fr);
    const esKeys = extractKeys(translations.es);

    assert.deepStrictEqual(enKeys, ukKeys, 'English keys must match Ukrainian keys');
    assert.deepStrictEqual(plKeys, ukKeys, 'Polish keys must match Ukrainian keys');
    assert.deepStrictEqual(deKeys, ukKeys, 'German keys must match Ukrainian keys');
    assert.deepStrictEqual(frKeys, ukKeys, 'French keys must match Ukrainian keys');
    assert.deepStrictEqual(esKeys, ukKeys, 'Spanish keys must match Ukrainian keys');
  });

  it('verifies non-empty string values for all keys', () => {
    for (const [locale, dict] of Object.entries(translations)) {
      const keys = extractKeys(dict);
      assert.ok(keys.length > 20, `Locale ${locale} must have rich translation coverage`);
    }
  });
});
