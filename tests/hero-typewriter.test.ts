import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceTypewriter, typewriterTiming, type TypewriterState } from '../src/components/HeroTypewriter';

test('third-line cycle types, holds six seconds, deletes, pauses one second and repeats without extra holds', () => {
  const length = Array.from('Look healthy').length;
  let state: TypewriterState = {count: 0, phase: 'typing'};
  for (let cycle = 0; cycle < 3; cycle++) {
    while (state.phase === 'typing') {
      const previous = state.count;
      assert.equal(typewriterTiming[state.phase], 110);
      state = advanceTypewriter(state, length);
      assert.equal(state.count, previous + 1);
    }
    assert.deepEqual(state, {count: length, phase: 'holding'});
    assert.equal(typewriterTiming[state.phase], 6000);
    state = advanceTypewriter(state, length);
    assert.equal(state.count, length - 1);
    while (state.phase === 'deleting') {
      const previous = state.count;
      assert.equal(typewriterTiming[state.phase], 70);
      state = advanceTypewriter(state, length);
      assert.equal(state.count, previous - 1);
    }
    assert.deepEqual(state, {count: 0, phase: 'empty'});
    assert.equal(typewriterTiming[state.phase], 1000);
    state = advanceTypewriter(state, length);
    assert.deepEqual(state, {count: 1, phase: 'typing'});
  }
});

test('empty/single-character input and fallback stay bounded', () => {
  assert.deepEqual(advanceTypewriter({count:0,phase:'typing'},0),{count:0,phase:'fallback'});
  assert.deepEqual(advanceTypewriter({count:0,phase:'empty'},1),{count:1,phase:'holding'});
  assert.deepEqual(advanceTypewriter({count:1,phase:'holding'},1),{count:0,phase:'empty'});
  assert.deepEqual(advanceTypewriter({count:12,phase:'fallback'},12),{count:12,phase:'fallback'});
});
