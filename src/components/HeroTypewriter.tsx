import { useEffect, useLayoutEffect, useState } from 'react';

export type TypewriterPhase = 'typing' | 'holding' | 'deleting' | 'empty' | 'fallback';
export interface TypewriterState { count: number; phase: TypewriterPhase }
export const typewriterTiming = { typing: 110, holding: 6000, deleting: 70, empty: 1000 } as const;

/** Full/empty holds end with a character change, avoiding an extra timer interval. */
export function advanceTypewriter(state: TypewriterState, length: number): TypewriterState {
  if (length < 1 || state.phase === 'fallback') return { count: length, phase: 'fallback' };
  if (state.phase === 'typing') {
    const count = Math.min(length, state.count + 1);
    return { count, phase: count === length ? 'holding' : 'typing' };
  }
  if (state.phase === 'holding' || state.phase === 'deleting') {
    const count = Math.max(0, state.count - 1);
    return { count, phase: count === 0 ? 'empty' : 'deleting' };
  }
  return { count: 1, phase: length === 1 ? 'holding' : 'typing' };
}

export default function HeroTypewriter({ text, reducedMotion, active }: {
  text: string; reducedMotion: boolean; active: boolean;
}) {
  const characters = Array.from(text);
  const length = characters.length;
  // Static text is the safe initial/failure rendering. Start before the first paint.
  const [state, setState] = useState<TypewriterState>({ count: length, phase: 'fallback' });
  useLayoutEffect(() => {
    setState({ count: reducedMotion ? length : 0, phase: reducedMotion ? 'fallback' : 'typing' });
  }, [text, length, reducedMotion]);

  useEffect(() => {
    if (!active || reducedMotion || !length || state.phase === 'fallback') return;
    let timer: number | undefined;
    try {
      timer = window.setTimeout(() => {
        try { setState(previous => advanceTypewriter(previous, length)); }
        catch { setState({ count: length, phase: 'fallback' }); }
      }, typewriterTiming[state.phase]);
    } catch { setState({ count: length, phase: 'fallback' }); }
    return () => window.clearTimeout(timer);
  }, [state, length, active, reducedMotion]);

  const staticText = reducedMotion || state.phase === 'fallback';
  return <span className="nita-typewriter" data-phase={staticText ? 'static' : state.phase} aria-hidden="true">
    <span className="nita-typewriter-reserve">{text}</span>
    <span className="nita-typewriter-visible">{staticText ? text : characters.slice(0, state.count).join('')}
      {!staticText && <span className={`nita-typewriter-cursor${active ? '' : ' is-paused'}`} />}
    </span>
  </span>;
}
