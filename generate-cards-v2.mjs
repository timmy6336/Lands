/**
 * Stylised SVG terrain art for each land card type.
 * Run: node generate-cards-v2.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'client', 'public', 'cards');
mkdirSync(outDir, { recursive: true });

// ── WHITE — Sunlit plains at golden hour ──────────────────────────────────────
const white = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffe0a0"/>
    <stop offset="45%" stop-color="#f8c840"/>
    <stop offset="75%" stop-color="#e89018"/>
    <stop offset="100%" stop-color="#c06010"/>
  </linearGradient>
  <radialGradient id="sun" cx="50%" cy="42%" r="28%">
    <stop offset="0%" stop-color="#fff8d0"/>
    <stop offset="40%" stop-color="#ffe860" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#ff8800" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e8d070"/>
    <stop offset="50%" stop-color="#c8a030"/>
    <stop offset="100%" stop-color="#a07820"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#sky)" rx="10"/>
<ellipse cx="100" cy="118" rx="56" ry="56" fill="url(#sun)"/>
<circle cx="100" cy="118" r="17" fill="#fff8c0" opacity="0.95"/>
<circle cx="100" cy="118" r="13" fill="#ffe840"/>
<g stroke="#ffe080" stroke-width="1.5" stroke-linecap="round" opacity="0.65">
  <line x1="100" y1="94"  x2="100" y2="86"/>
  <line x1="116" y1="100" x2="122" y2="94"/>
  <line x1="123" y1="118" x2="131" y2="118"/>
  <line x1="116" y1="136" x2="122" y2="142"/>
  <line x1="100" y1="142" x2="100" y2="150"/>
  <line x1="84"  y1="136" x2="78"  y2="142"/>
  <line x1="77"  y1="118" x2="69"  y2="118"/>
  <line x1="84"  y1="100" x2="78"  y2="94"/>
</g>
<polygon points="75,0 125,0 145,200 55,200" fill="rgba(255,240,140,0.055)"/>
<g opacity="0.88">
  <ellipse cx="38"  cy="88"  rx="20" ry="8"  fill="#fffef0"/>
  <ellipse cx="52"  cy="84"  rx="16" ry="9"  fill="#ffffff"/>
  <ellipse cx="26"  cy="86"  rx="13" ry="6"  fill="#fffef0"/>
  <ellipse cx="158" cy="95"  rx="18" ry="7"  fill="#fffef0"/>
  <ellipse cx="171" cy="91"  rx="14" ry="8"  fill="#ffffff"/>
  <ellipse cx="145" cy="93"  rx="11" ry="5"  fill="#fffef0"/>
</g>
<path d="M0 200 Q35 174 70 183 Q105 192 140 175 Q168 163 200 178 L200 280 L0 280 Z" fill="#8aba5a" opacity="0.55"/>
<path d="M0 216 Q30 196 62 204 Q90 210 122 196 Q150 185 178 200 Q192 206 200 200 L200 280 L0 280 Z" fill="#7aaa48"/>
<path d="M0 240 Q45 222 78 230 Q110 238 142 225 Q168 216 200 228 L200 280 L0 280 Z" fill="#69993a"/>
<rect x="0" y="260" width="200" height="20" fill="#527a28"/>
<g stroke="#3d6018" stroke-width="1.3" stroke-linecap="round" opacity="0.65">
  <line x1="22" y1="260" x2="20" y2="252"/> <line x1="26" y1="260" x2="28" y2="251"/>
  <line x1="58" y1="256" x2="56" y2="248"/> <line x1="62" y1="256" x2="64" y2="247"/>
  <line x1="98" y1="260" x2="96" y2="251"/> <line x1="102" y1="260" x2="104" y2="250"/>
  <line x1="142" y1="256" x2="140" y2="248"/> <line x1="146" y1="256" x2="148" y2="247"/>
  <line x1="174" y1="260" x2="172" y2="252"/> <line x1="178" y1="260" x2="180" y2="251"/>
</g>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#e8d070" stroke-width="0.7" stroke-opacity="0.5"/>
<g fill="#d4a830" opacity="0.85">
  <polygon points="9,9 20,9 9,20"/>
  <polygon points="191,9 180,9 191,20"/>
  <polygon points="9,271 20,271 9,260"/>
  <polygon points="191,271 180,271 191,260"/>
</g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.5)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#f5dfa0" letter-spacing="2.5">FIELDS</text>
</svg>`;

// ── RED — Volcanic mountain at eruption ───────────────────────────────────────
const red = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a0004"/>
    <stop offset="50%" stop-color="#2a0808"/>
    <stop offset="80%" stop-color="#6a1010"/>
    <stop offset="100%" stop-color="#cc2800"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="100%" r="60%">
    <stop offset="0%" stop-color="#ff5500" stop-opacity="0.9"/>
    <stop offset="50%" stop-color="#cc2200" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#880000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="eg" cx="50%" cy="68%" r="25%">
    <stop offset="0%" stop-color="#ff8800" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#cc2200" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e84820"/>
    <stop offset="50%" stop-color="#aa2000"/>
    <stop offset="100%" stop-color="#601000"/>
  </linearGradient>
  <linearGradient id="lava" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff8800"/>
    <stop offset="100%" stop-color="#cc2200"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#sky)" rx="10"/>
<path d="M0 198 L30 140 L55 168 L75 120 L100 80 L125 118 L148 155 L172 130 L200 170 L200 280 L0 280 Z" fill="#1a0505"/>
<path d="M0 220 L25 175 L50 195 L80 148 L100 112 L120 148 L150 195 L175 170 L200 198 L200 280 L0 280 Z" fill="#280a05"/>
<ellipse cx="100" cy="112" rx="30" ry="20" fill="url(#eg)"/>
<path d="M96 118 Q98 145 94 170 Q92 185 96 200 Q100 215 104 200 Q108 185 106 170 Q102 145 104 118 Z" fill="url(#lava)" opacity="0.85"/>
<path d="M94 155 Q82 162 70 170 Q60 178 55 190 Q68 185 78 178 Q88 170 94 165 Z" fill="url(#lava)" opacity="0.7"/>
<path d="M106 162 Q118 168 130 178 Q140 186 146 196 Q133 190 122 182 Q112 174 106 167 Z" fill="url(#lava)" opacity="0.7"/>
<ellipse cx="100" cy="248" rx="60" ry="14" fill="#cc2200" opacity="0.7"/>
<ellipse cx="100" cy="248" rx="40" ry="9"  fill="#ff5500" opacity="0.6"/>
<ellipse cx="100" cy="248" rx="20" ry="5"  fill="#ff9900" opacity="0.55"/>
<rect x="0" y="255" width="200" height="25" fill="url(#glow)" opacity="0.6"/>
<g opacity="0.5">
  <ellipse cx="100" cy="50"  rx="35" ry="18" fill="#1a0a0a"/>
  <ellipse cx="78"  cy="38"  rx="22" ry="12" fill="#1a0a0a"/>
  <ellipse cx="124" cy="40"  rx="20" ry="11" fill="#1a0a0a"/>
  <ellipse cx="100" cy="32"  rx="28" ry="14" fill="#120606"/>
</g>
<g fill="#ff8800" opacity="0.9">
  <circle cx="88"  cy="88"  r="1.2"/> <circle cx="112" cy="78"  r="1.5"/>
  <circle cx="76"  cy="70"  r="1"/>   <circle cx="128" cy="68"  r="1.3"/>
  <circle cx="95"  cy="62"  r="0.9"/> <circle cx="106" cy="58"  r="1.2"/>
  <circle cx="82"  cy="55"  r="1"/>   <circle cx="118" cy="52"  r="1.4"/>
</g>
<g fill="#ffcc00" opacity="0.7">
  <circle cx="100" cy="72"  r="0.8"/> <circle cx="91"  cy="48"  r="1"/>
  <circle cx="110" cy="44"  r="0.7"/>
</g>
<path d="M0 268 Q15 258 30 265 Q45 272 60 263 L60 280 L0 280 Z"   fill="#1a0505"/>
<path d="M140 266 Q158 256 172 263 Q186 270 200 260 L200 280 L140 280 Z" fill="#1a0505"/>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#e84820" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#cc3010" opacity="0.85">
  <polygon points="9,9 20,9 9,20"/>   <polygon points="191,9 180,9 191,20"/>
  <polygon points="9,271 20,271 9,260"/> <polygon points="191,271 180,271 191,260"/>
</g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#ffb090" letter-spacing="2.5">PEAKS</text>
</svg>`;

// ── BLUE — Moonlit ocean at midnight ─────────────────────────────────────────
const blue = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#02040f"/>
    <stop offset="55%" stop-color="#060e28"/>
    <stop offset="100%" stop-color="#0a1840"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a2060"/>
    <stop offset="100%" stop-color="#040c28"/>
  </linearGradient>
  <radialGradient id="mg" cx="50%" cy="30%" r="32%">
    <stop offset="0%" stop-color="#d8f0ff" stop-opacity="0.9"/>
    <stop offset="40%" stop-color="#6098d8" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#102060" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#6890d8"/>
    <stop offset="50%" stop-color="#3860a8"/>
    <stop offset="100%" stop-color="#183888"/>
  </linearGradient>
  <linearGradient id="ref" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#c0d8ff" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#3060a8" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#sky)" rx="10"/>
<g fill="#d8eeff" opacity="0.9">
  <circle cx="18"  cy="20"  r="0.8"/> <circle cx="42"  cy="14"  r="1.1"/>
  <circle cx="68"  cy="30"  r="0.7"/> <circle cx="85"  cy="18"  r="0.9"/>
  <circle cx="130" cy="24"  r="1.2"/> <circle cx="155" cy="16"  r="0.8"/>
  <circle cx="172" cy="35"  r="1"/>   <circle cx="188" cy="12"  r="0.7"/>
  <circle cx="30"  cy="48"  r="0.9"/> <circle cx="55"  cy="55"  r="0.6"/>
  <circle cx="160" cy="50"  r="0.8"/> <circle cx="178" cy="58"  r="1.1"/>
  <circle cx="14"  cy="65"  r="0.7"/> <circle cx="190" cy="78"  r="0.8"/>
</g>
<g fill="#a8c4ff" opacity="0.6">
  <circle cx="28"  cy="38"  r="0.6"/> <circle cx="78"  cy="46"  r="0.5"/>
  <circle cx="108" cy="22"  r="0.6"/> <circle cx="145" cy="40"  r="0.5"/>
  <circle cx="168" cy="28"  r="0.6"/>
</g>
<ellipse cx="100" cy="84" rx="44" ry="44" fill="url(#mg)"/>
<circle cx="100" cy="84" r="20" fill="#e8f4ff" opacity="0.95"/>
<circle cx="100" cy="84" r="18" fill="#d8ecff"/>
<circle cx="93"  cy="80" r="3"   fill="#c0d8f0" opacity="0.5"/>
<circle cx="108" cy="90" r="2"   fill="#c0d8f0" opacity="0.4"/>
<circle cx="104" cy="76" r="1.5" fill="#c0d8f0" opacity="0.4"/>
<path d="M0 168 Q25 160 50 165 Q75 170 100 162 Q125 155 150 163 Q175 170 200 164 L200 168 Z" fill="#0a1840"/>
<rect x="0" y="168" width="200" height="112" fill="url(#water)"/>
<path d="M82 168 L118 168 L128 280 L72 280 Z" fill="url(#ref)" opacity="0.35"/>
<g stroke="#2050a0" stroke-width="1" fill="none" opacity="0.6">
  <path d="M10  180 Q30  176 50  180 Q70  184 90  180 Q110 176 130 180 Q150 184 170 180 Q185 177 200 180"/>
  <path d="M0   192 Q22  188 44  192 Q66  196 88  192 Q110 188 132 192 Q154 196 176 192 Q190 189 200 192"/>
  <path d="M5   205 Q28  200 52  205 Q76  210 100 205 Q124 200 148 205 Q172 210 196 205"/>
</g>
<g stroke="#3868c0" stroke-width="1.2" fill="none" opacity="0.55">
  <path d="M0   220 Q24  214 48  220 Q72  226 96  220 Q120 214 144 220 Q168 226 200 220"/>
  <path d="M0   238 Q28  232 56  238 Q84  244 112 238 Q140 232 168 238 Q184 242 200 240"/>
</g>
<g fill="#8ab8f8" opacity="0.45">
  <ellipse cx="40"  cy="256" rx="6" ry="1.4"/>
  <ellipse cx="100" cy="248" rx="8" ry="1.6"/>
  <ellipse cx="160" cy="260" rx="5" ry="1.2"/>
  <ellipse cx="75"  cy="268" rx="4" ry="1"/>
  <ellipse cx="130" cy="272" rx="6" ry="1.3"/>
</g>
<ellipse cx="30"  cy="167" rx="12" ry="4" fill="#060e20" opacity="0.8"/>
<ellipse cx="170" cy="165" rx="10" ry="3" fill="#060e20" opacity="0.8"/>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#6890d8" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#2850a8" opacity="0.85">
  <polygon points="9,9 20,9 9,20"/>   <polygon points="191,9 180,9 191,20"/>
  <polygon points="9,271 20,271 9,260"/> <polygon points="191,271 180,271 191,260"/>
</g>
<rect x="62" y="257" width="76" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#90c8f8" letter-spacing="2.5">SHORES</text>
</svg>`;

// ── GREEN — Ancient forest with shafts of light ───────────────────────────────
const green = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a1a08"/>
    <stop offset="40%" stop-color="#122810"/>
    <stop offset="100%" stop-color="#1a3c14"/>
  </linearGradient>
  <radialGradient id="lp" cx="50%" cy="45%" r="35%">
    <stop offset="0%" stop-color="#b0e870" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="#204010" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#60c040"/>
    <stop offset="50%" stop-color="#308828"/>
    <stop offset="100%" stop-color="#185010"/>
  </linearGradient>
  <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#203c10"/>
    <stop offset="100%" stop-color="#101808"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#sky)" rx="10"/>
<ellipse cx="100" cy="126" rx="60" ry="60" fill="url(#lp)"/>
<polygon points="82,0 90,160 110,160 118,0"   fill="rgba(180,240,120,0.055)"/>
<polygon points="44,0 38,160 60,160 70,0"     fill="rgba(160,220,100,0.04)"/>
<polygon points="130,0 140,0 162,160 140,160" fill="rgba(160,220,100,0.04)"/>
<g fill="#0a1a06" opacity="0.9">
  <rect x="8"   y="90"  width="10" height="110"/> <ellipse cx="13"  cy="88"  rx="14" ry="24"/>
  <rect x="26"  y="100" width="8"  height="100"/> <ellipse cx="30"  cy="98"  rx="12" ry="20"/>
  <rect x="164" y="92"  width="10" height="108"/> <ellipse cx="169" cy="90"  rx="14" ry="23"/>
  <rect x="182" y="102" width="8"  height="98"/>  <ellipse cx="186" cy="100" rx="11" ry="19"/>
</g>
<g fill="#122808">
  <rect x="55"  y="80"  width="12" height="130"/> <ellipse cx="61"  cy="76"  rx="20" ry="32"/>
  <ellipse cx="61"  cy="64"  rx="14" ry="22"/>
  <rect x="128" y="82"  width="12" height="128"/> <ellipse cx="134" cy="78"  rx="20" ry="32"/>
  <ellipse cx="134" cy="66"  rx="14" ry="22"/>
</g>
<g fill="#0c1e06">
  <rect x="14"  y="60"  width="16" height="220"/> <ellipse cx="22"  cy="55"  rx="26" ry="42"/>
  <ellipse cx="22"  cy="36"  rx="18" ry="28"/>
  <rect x="170" y="62"  width="16" height="218"/> <ellipse cx="178" cy="57"  rx="26" ry="42"/>
  <ellipse cx="178" cy="38"  rx="18" ry="28"/>
</g>
<rect x="92" y="148" width="16" height="132" fill="#0e2008"/>
<ellipse cx="100" cy="144" rx="28" ry="44" fill="#142e0a"/>
<ellipse cx="100" cy="124" rx="20" ry="30" fill="#1a3810"/>
<path d="M0 240 Q50 224 100 234 Q150 244 200 228 L200 280 L0 280 Z" fill="url(#gd)"/>
<g fill="#2a6018" opacity="0.7">
  <ellipse cx="45"  cy="242" rx="6" ry="3"/>   <ellipse cx="80"  cy="248" rx="5" ry="2.5"/>
  <ellipse cx="122" cy="244" rx="6" ry="3"/>   <ellipse cx="158" cy="240" rx="5" ry="2.5"/>
</g>
<g fill="#48a028" opacity="0.5">
  <circle cx="35"  cy="240" r="2"/> <circle cx="68"  cy="246" r="1.5"/>
  <circle cx="110" cy="242" r="2"/> <circle cx="148" cy="238" r="1.5"/>
  <circle cx="175" cy="243" r="2"/>
</g>
<g fill="#c0ff80" opacity="0.7">
  <circle cx="72"  cy="108" r="1.2"/> <circle cx="130" cy="114" r="1"/>
  <circle cx="95"  cy="90"  r="1.4"/> <circle cx="110" cy="136" r="1"/>
  <circle cx="60"  cy="130" r="1.2"/>
</g>
<path d="M0 0 Q50 50 0 80 L0 0 Z"        fill="#0a1a06" opacity="0.6"/>
<path d="M200 0 Q150 50 200 80 L200 0 Z" fill="#0a1a06" opacity="0.6"/>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#60c040" stroke-width="0.7" stroke-opacity="0.4"/>
<g fill="#289020" opacity="0.85">
  <polygon points="9,9 20,9 9,20"/>   <polygon points="191,9 180,9 191,20"/>
  <polygon points="9,271 20,271 9,260"/> <polygon points="191,271 180,271 191,260"/>
</g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#90e870" letter-spacing="2.5">WOODS</text>
</svg>`;

// ── BLACK — Haunted swamp under a sickly moon ─────────────────────────────────
const black = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#04020a"/>
    <stop offset="55%" stop-color="#0a0618"/>
    <stop offset="100%" stop-color="#100820"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0c0820"/>
    <stop offset="100%" stop-color="#060410"/>
  </linearGradient>
  <radialGradient id="moon" cx="68%" cy="28%" r="22%">
    <stop offset="0%" stop-color="#a090c8" stop-opacity="0.7"/>
    <stop offset="60%" stop-color="#604880" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#200820" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="wispa" cx="30%" cy="75%" r="18%">
    <stop offset="0%" stop-color="#30c860" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#008040" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="wispb" cx="72%" cy="80%" r="14%">
    <stop offset="0%" stop-color="#2090a0" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#005060" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.65)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#6840a8"/>
    <stop offset="50%" stop-color="#3c1870"/>
    <stop offset="100%" stop-color="#180830"/>
  </linearGradient>
  <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a1030" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#1a1030" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#sky)" rx="10"/>
<ellipse cx="136" cy="78" rx="34" ry="34" fill="url(#moon)"/>
<circle cx="136" cy="78" r="16" fill="#c0b0e0" opacity="0.9"/>
<circle cx="136" cy="78" r="14" fill="#b8a8d8"/>
<circle cx="140" cy="75" r="12" fill="#0a0618"  opacity="0.65"/>
<g fill="#06040e" opacity="0.85">
  <rect x="22"  y="98"  width="4" height="120"/>
  <line x1="24" y1="108" x2="12"  y2="96"  stroke="#06040e" stroke-width="2"/>
  <line x1="24" y1="115" x2="36"  y2="104" stroke="#06040e" stroke-width="2"/>
  <rect x="170" y="102" width="4" height="116"/>
  <line x1="172" y1="112" x2="160" y2="100" stroke="#06040e" stroke-width="2"/>
  <line x1="172" y1="120" x2="184" y2="108" stroke="#06040e" stroke-width="2"/>
</g>
<g fill="#8870c0" opacity="0.55">
  <circle cx="20"  cy="24"  r="0.9"/> <circle cx="50"  cy="18"  r="0.7"/>
  <circle cx="76"  cy="32"  r="1"/>   <circle cx="165" cy="20"  r="0.8"/>
  <circle cx="188" cy="40"  r="0.9"/> <circle cx="15"  cy="55"  r="0.6"/>
  <circle cx="192" cy="62"  r="0.7"/>
</g>
<path d="M0 170 Q50 162 100 168 Q150 174 200 165 L200 178 Q150 185 100 180 Q50 175 0 182 Z" fill="#180e30" opacity="0.6"/>
<rect x="0" y="175" width="200" height="105" fill="url(#water)"/>
<path d="M0 175 Q50 170 100 175 Q150 180 200 172 L200 178 Q150 184 100 180 Q50 176 0 182 Z" fill="#2a1850" opacity="0.4"/>
<ellipse cx="60"  cy="210" rx="30" ry="18" fill="url(#wispa)"/>
<ellipse cx="144" cy="222" rx="24" ry="14" fill="url(#wispb)"/>
<g fill="#080510">
  <rect x="10" y="40" width="8" height="230"/>
  <line x1="14" y1="65"  x2="-2"  y2="48"  stroke="#080510" stroke-width="5"/>
  <line x1="14" y1="80"  x2="32"  y2="62"  stroke="#080510" stroke-width="4"/>
  <line x1="14" y1="100" x2="0"   y2="88"  stroke="#080510" stroke-width="3"/>
  <line x1="14" y1="120" x2="30"  y2="106" stroke="#080510" stroke-width="3"/>
  <line x1="32" y1="62"  x2="44"  y2="50"  stroke="#080510" stroke-width="2.5"/>
  <rect x="178" y="44" width="8" height="226"/>
  <line x1="182" y1="68"  x2="200" y2="52"  stroke="#080510" stroke-width="5"/>
  <line x1="182" y1="84"  x2="164" y2="66"  stroke="#080510" stroke-width="4"/>
  <line x1="182" y1="104" x2="196" y2="92"  stroke="#080510" stroke-width="3"/>
  <line x1="182" y1="124" x2="168" y2="110" stroke="#080510" stroke-width="3"/>
  <line x1="164" y1="66"  x2="152" y2="54"  stroke="#080510" stroke-width="2.5"/>
  <rect x="97" y="130" width="6" height="150"/>
  <line x1="100" y1="148" x2="86"  y2="136" stroke="#080510" stroke-width="3"/>
  <line x1="100" y1="162" x2="114" y2="150" stroke="#080510" stroke-width="2.5"/>
</g>
<ellipse cx="60"  cy="214" rx="14" ry="4"   fill="none" stroke="#302050" stroke-width="0.8" opacity="0.4"/>
<ellipse cx="60"  cy="214" rx="22" ry="6"   fill="none" stroke="#302050" stroke-width="0.6" opacity="0.25"/>
<ellipse cx="144" cy="226" rx="12" ry="3.5" fill="none" stroke="#204050" stroke-width="0.8" opacity="0.4"/>
<rect x="0" y="200" width="200" height="40" fill="url(#mist)"/>
<circle cx="58"  cy="205" r="3"   fill="#40e878" opacity="0.7"/>
<circle cx="62"  cy="208" r="1.5" fill="#80ffaa" opacity="0.8"/>
<circle cx="142" cy="218" r="2.5" fill="#30b8c0" opacity="0.65"/>
<circle cx="146" cy="222" r="1.2" fill="#60d8e0" opacity="0.75"/>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#6840a8" stroke-width="0.7" stroke-opacity="0.4"/>
<g fill="#402080" opacity="0.85">
  <polygon points="9,9 20,9 9,20"/>   <polygon points="191,9 180,9 191,20"/>
  <polygon points="9,271 20,271 9,260"/> <polygon points="191,271 180,271 191,260"/>
</g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.6)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#c090f8" letter-spacing="2.5">MARSH</text>
</svg>`;

// ── BACK — Arcane card back ───────────────────────────────────────────────────
const back = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0e0a24"/>
    <stop offset="50%" stop-color="#0a0818"/>
    <stop offset="100%" stop-color="#06040e"/>
  </linearGradient>
  <radialGradient id="cg" cx="50%" cy="50%" r="38%">
    <stop offset="0%" stop-color="#6040c8" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#0a0618" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vig" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8060e0"/>
    <stop offset="50%" stop-color="#5038a8"/>
    <stop offset="100%" stop-color="#281860"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#bg)" rx="10"/>
<g fill="#a080e8" opacity="0.45">
  <circle cx="18"  cy="22"  r="0.8"/> <circle cx="45"  cy="16"  r="0.6"/>
  <circle cx="72"  cy="30"  r="0.9"/> <circle cx="130" cy="18"  r="0.7"/>
  <circle cx="158" cy="28"  r="0.8"/> <circle cx="182" cy="14"  r="0.6"/>
  <circle cx="190" cy="45"  r="0.8"/> <circle cx="12"  cy="58"  r="0.7"/>
  <circle cx="24"  cy="240" r="0.7"/> <circle cx="178" cy="248" r="0.8"/>
  <circle cx="192" cy="260" r="0.6"/> <circle cx="10"  cy="266" r="0.9"/>
</g>
<ellipse cx="100" cy="140" rx="70" ry="70" fill="url(#cg)"/>
<circle cx="100" cy="140" r="60" fill="none" stroke="#5038a0" stroke-width="1.2" stroke-opacity="0.7"/>
<circle cx="100" cy="140" r="55" fill="none" stroke="#6048b8" stroke-width="0.6" stroke-opacity="0.5"/>
<polygon points="100,82 107,118 140,108 118,132 140,172 107,162 100,198 93,162 60,172 82,132 60,108 93,118"
         fill="#5038a0" fill-opacity="0.18" stroke="#7858d0" stroke-width="1.2" stroke-opacity="0.75"/>
<polygon points="100,96 104,120 126,114 112,130 126,160 104,154 100,178 96,154 74,160 88,130 74,114 96,120"
         fill="none" stroke="#9070e0" stroke-width="0.8" stroke-opacity="0.5"/>
<circle cx="100" cy="140" r="18" fill="#0e0820" stroke="#8860d8" stroke-width="1.4"/>
<circle cx="100" cy="140" r="12" fill="none" stroke="#a080e8" stroke-width="0.7" stroke-opacity="0.7"/>
<g stroke="#7858d0" stroke-width="1.2" stroke-linecap="round" opacity="0.65">
  <line x1="100" y1="80"  x2="100" y2="87"/>
  <line x1="160" y1="140" x2="153" y2="140"/>
  <line x1="100" y1="200" x2="100" y2="193"/>
  <line x1="40"  y1="140" x2="47"  y2="140"/>
  <line x1="142" y1="98"  x2="137" y2="103"/>
  <line x1="142" y1="182" x2="137" y2="177"/>
  <line x1="58"  y1="182" x2="63"  y2="177"/>
  <line x1="58"  y1="98"  x2="63"  y2="103"/>
</g>
<g stroke="#5038a0" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.75">
  <path d="M14 14 L14 28 M14 14 L28 14"/>
  <path d="M186 14 L186 28 M186 14 L172 14"/>
  <path d="M14 266 L14 252 M14 266 L28 266"/>
  <path d="M186 266 L186 252 M186 266 L172 266"/>
</g>
<rect x="18" y="18" width="164" height="244" rx="5" fill="none" stroke="#402888" stroke-width="0.8" stroke-opacity="0.4"/>
<g fill="#6048b0" opacity="0.6">
  <circle cx="26"  cy="26"  r="2"/> <circle cx="174" cy="26"  r="2"/>
  <circle cx="26"  cy="254" r="2"/> <circle cx="174" cy="254" r="2"/>
</g>
<rect x="22" y="22" width="156" height="236" rx="4" fill="none" stroke="#302060" stroke-width="0.5" stroke-opacity="0.35"/>
<rect width="200" height="280" fill="url(#vig)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
</svg>`;

// ── Write files ───────────────────────────────────────────────────────────────
// Cards must live in TWO places:
//   1. client/public/cards/  — served by Vite dev server / web build
//   2. resources/cards/      — bundled resource used by Electron at runtime
const outDirs = [
  outDir,
  join(__dirname, 'resources', 'cards'),
];
const files = { white, red, blue, green, black, back };
for (const dir of outDirs) {
  mkdirSync(dir, { recursive: true });
  for (const [name, svg] of Object.entries(files)) {
    const outPath = join(dir, `${name}.svg`);
    writeFileSync(outPath, svg, 'utf8');
    console.log(`Created: ${outPath}`);
  }
}
console.log('\nDone! New card art is in client/public/cards/ and resources/cards/');
