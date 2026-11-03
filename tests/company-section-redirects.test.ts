import test from 'node:test';
import assert from 'node:assert/strict';
import { companySectionForHash } from '../src/data/companySections';

test('legacy quality, sustainability and purpose bookmarks resolve into the single company page', () => {
  for (const [hash, section] of [['#certifications', 'production'], ['#quality', 'production'], ['#farmers', 'community'], ['#sustainability', 'community'], ['#vision', 'mission'], ['#our-story', 'story']]) {
    assert.equal(companySectionForHash(hash), section);
  }
});

test('unknown, empty and malformed old fragments use the route-specific fallback', () => {
  for (const hash of ['', '#unknown', '#%E0%A4%A', '#__proto__', '#constructor']) {
    assert.equal(companySectionForHash(hash, 'production'), 'production');
    assert.equal(companySectionForHash(hash, 'story'), 'story');
  }
});

test('known combined-page sections survive redirects and encoded fragments decode safely', () => {
  assert.equal(companySectionForHash('#values', 'production'), 'values');
  assert.equal(companySectionForHash('#%63ertifications', 'story'), 'production');
  assert.equal(companySectionForHash('#unknown'), 'unknown');
  assert.equal(companySectionForHash('#%E0%A4%A'), '');
});
