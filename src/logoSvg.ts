/** Logo GRG Personal Trainer in vettoriale (nitido a qualsiasi dimensione). */
export const logoSvg = (fg: string, red: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 230">
<!-- bilanciere -->
<g fill="${fg}">
  <rect x="64" y="22" width="34" height="112" rx="14"/>
  <rect x="102" y="38" width="20" height="80" rx="9"/>
  <rect x="124" y="64" width="12" height="28" rx="3"/>
  <rect x="442" y="22" width="34" height="112" rx="14"/>
  <rect x="418" y="38" width="20" height="80" rx="9"/>
  <rect x="404" y="64" width="12" height="28" rx="3"/>
</g>
<rect x="136" y="74" width="268" height="8" fill="${red}"/>
<!-- GR -->
<g transform="translate(5 0) skewX(-12)" fill="none" stroke="${fg}" stroke-linejoin="miter">
  <path d="M 258 38 H 204 Q 184 38 184 58 V 98 Q 184 118 204 118 H 258 V 82 H 222" stroke-width="17" transform="translate(-17 0)"/>
  <path d="M 288 118 V 38 H 346 Q 368 38 368 60 V 70 Q 368 92 346 92 H 288 M 332 92 L 372 118" stroke-width="17" transform="translate(4 0)"/>
</g>
<!-- battito -->
<path d="M 136 78 H 214 L 226 78 L 238 44 L 252 128 L 266 18 L 280 140 L 292 64 L 304 78 H 404" fill="none" stroke="${red}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<!-- scritte -->
<text x="270" y="190" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-style="italic" font-size="52" letter-spacing="3" fill="${fg}">PERSONAL</text>
<text x="270" y="222" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-style="italic" font-size="22" letter-spacing="14" fill="${fg}">TRAINER</text>
<rect x="66" y="211" width="84" height="3" fill="${red}"/>
<rect x="390" y="211" width="84" height="3" fill="${red}"/>
</svg>`;
