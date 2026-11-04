import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { COLORS, GRADIENTS, Implement, Shape, VIEW, buildFrame, phaseToS } from './engine';
import { PATTERNS } from './patterns';

const CYCLE_MS = 2800;
const FRAME_MS = 40;

/** Omino animato in SVG (disegnato dall'app, nessun file esterno). */
export function ExerciseAnimation({
  pattern,
  impl,
  primary,
  secondary,
}: {
  pattern: string;
  impl: Implement;
  primary: string[];
  secondary: string[];
}) {
  const pat = PATTERNS[pattern];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setPhase(((Date.now() - t0) % CYCLE_MS) / CYCLE_MS), FRAME_MS);
    return () => clearInterval(id);
  }, []);

  const pKey = primary.join(',');
  const sKey = secondary.join(',');
  const frame = useMemo(
    () => (pat ? buildFrame(pat, phaseToS(phase), impl, primary, secondary) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pat, phase, impl, pKey, sKey],
  );
  if (!pat || !frame) return null;

  return (
    <View style={{ width: '100%', aspectRatio: VIEW.w / VIEW.h, backgroundColor: COLORS.bg }}>
      <Svg width="100%" height="100%" viewBox={frame.vb.join(' ')}>
        <Defs>
          {GRADIENTS.map((g) => (
            <LinearGradient key={g.id} id={g.id} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
              {g.stops.map(([o, c]) => (
                <Stop key={o} offset={o} stopColor={c} />
              ))}
            </LinearGradient>
          ))}
        </Defs>
        {frame.shapes.map((s, i) => renderShape(s, i))}
      </Svg>
    </View>
  );
}

function renderShape(s: Shape, i: number) {
  switch (s.k) {
    case 'path':
      return (
        <Path
          key={i}
          d={s.d}
          fill={s.f ?? 'none'}
          stroke={s.s}
          strokeWidth={s.sw}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={s.o ?? 1}
        />
      );
    case 'circle':
      return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.f} stroke={s.s} strokeWidth={s.sw} opacity={s.o ?? 1} />;
    case 'ellipse':
      return (
        <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={s.f} stroke={s.s} strokeWidth={s.sw} opacity={s.o ?? 1} />
      );
    case 'line':
      return (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={s.w} strokeLinecap="round" opacity={s.o ?? 1} />
      );
  }
}
