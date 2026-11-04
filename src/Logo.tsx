import React from 'react';
import { SvgXml } from 'react-native-svg';
import { logoSvg } from './logoSvg';
import { colors } from './theme';

/** Logo vettoriale. Di default nero su sfondo chiaro. */
export function Logo({
  width,
  height,
  color = colors.text,
  background = colors.bg,
}: {
  width: number | string;
  height: number | string;
  color?: string;
  background?: string;
}) {
  return <SvgXml xml={logoSvg(color, background)} width={width} height={height} />;
}
