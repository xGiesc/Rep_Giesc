import React from 'react';
import { SvgXml } from 'react-native-svg';
import { logoSvg } from './logoSvg';
import { colors } from './theme';

/** Logo vettoriale (proporzioni 540×230). */
export function Logo({ width, height }: { width: number | string; height: number | string }) {
  return <SvgXml xml={logoSvg(colors.ink, colors.accent)} width={width} height={height} />;
}
