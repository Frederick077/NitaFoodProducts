import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTZS } from '../src/utils';

test('TZS formatting has one currency label and preserves whole-shilling rounding', () => {
  assert.equal(formatTZS(8000), '8,000 TZS');
  assert.equal(formatTZS(0), '0 TZS');
  assert.equal(formatTZS(12500.5), '12,501 TZS');
  assert.equal(formatTZS(-1250), '-1,250 TZS');
  assert.equal(formatTZS(8000 * 3), '24,000 TZS');
  assert.doesNotMatch(formatTZS(8000), /TSh/);
});
