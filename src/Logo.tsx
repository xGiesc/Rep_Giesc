import React from 'react';
import { SvgXml } from 'react-native-svg';
import { LOGO_SVG } from './logoSvg';

export function Logo({ width, height }: { width: number | string; height: number | string }) {
  return <SvgXml xml={LOGO_SVG} width={width} height={height} />;
}
