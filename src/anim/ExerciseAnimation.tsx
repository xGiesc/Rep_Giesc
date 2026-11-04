import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';
import { COLORS, Implement, Shape, VIEW, buildFrame, phaseToS } from './engine';
import { PATTERNS } from './patterns';

const CYCLE_MS = 2800;

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
    const id = setInterval(
      () => setPhase(((Date.now() - t0) % CYCLE_MS) / CYCLE_MS),
      33,
    );
    return () => clearInterval(id);
  }, []);

  const pKey = primary.join(',');
  const sKey = secondary.join(',');
  const shapes: Shape[] = useMemo(
    () => (pat ? buildFrame(pat, phaseToS(phase), impl, primary, secondary) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pat, phase, impl, pKey, sKey],
  );
  if (!pat) return null;

  return (
    <View style={{ width: '100%', aspectRatio: VIEW.w / VIEW.h, backgroundColor: COLORS.bg }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}>
        {shapes.map((s, i) => {
          switch (s.k) {
            case 'line':
              return (
                <Line
                  key={i}
                  x1={s.x1}
                  y1={s.y1}
                  x2={s.x2}
                  y2={s.y2}
                  stroke={s.c}
                  strokeWidth={s.w}
                  strokeLinecap="round"
                  opacity={s.o ?? 1}
                />
              );
            case 'circle':
              return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.c} opacity={s.o ?? 1} />;
            case 'rect':
              return (
                <Rect
                  key={i}
                  x={s.x}
                  y={s.y}
                  width={s.w}
                  height={s.h}
                  rx={s.rx ?? 0}
                  fill={s.c}
                  opacity={s.o ?? 1}
                />
              );
            case 'poly':
              return (
                <Polygon
                  key={i}
                  points={s.pts.map((p) => p.join(',')).join(' ')}
                  fill={s.c}
                  stroke={s.sc}
                  strokeWidth={s.sw}
                  strokeLinejoin="round"
                  opacity={s.o ?? 1}
                />
              );
          }
        })}
      </Svg>
    </View>
  );
}
