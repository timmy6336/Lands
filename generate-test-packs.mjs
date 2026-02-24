/**
 * Generates SVG art for the three built-in test skin packs:
 *   gilded   — warm gold/amber terrain re-skin
 *   obsidian — dark crystalline geometry
 *   neon     — synthwave / cyberpunk landscapes
 *
 * Run: node generate-test-packs.mjs
 * Output: client/public/cards/skins/{packId}/{color}.svg  + preview.svg
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skinsRoot = join(__dirname, 'client', 'public', 'cards', 'skins');

function write(packId, name, svg) {
  const dir = join(skinsRoot, packId);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${name}.svg`);
  writeFileSync(p, svg, 'utf8');
  console.log(`  ${p}`);
}

// ═════════════════════════════════════════════════════════════════════════════
//  PACK: GILDED — warm gold / amber / bronze terrain art
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n── GILDED ──');

// Gilded White — ancient sunlit ruins on golden plains
write('gilded', 'white', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#fff4c0"/><stop offset="60%" stop-color="#f0c040"/><stop offset="100%" stop-color="#b08010"/>
  </linearGradient>
  <radialGradient id="sun" cx="50%" cy="38%" r="26%">
    <stop offset="0%" stop-color="#fff8e0"/><stop offset="100%" stop-color="#f0b020" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(60,30,0,0.5)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffd060"/><stop offset="100%" stop-color="#a06010"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="106" rx="50" ry="50" fill="url(#sun)"/>
<circle cx="100" cy="106" r="15" fill="#fff8d0" opacity="0.95"/>
<!-- rolling hills -->
<path d="M0 200 Q50 178 100 188 Q150 198 200 180 L200 280 L0 280 Z" fill="#c8a030" opacity="0.6"/>
<path d="M0 220 Q40 205 80 212 Q120 219 160 205 Q180 198 200 208 L200 280 L0 280 Z" fill="#b08020"/>
<path d="M0 248 Q50 235 100 242 Q150 249 200 238 L200 280 L0 280 Z" fill="#906018"/>
<!-- ancient columns -->
<g fill="#e8c050" stroke="#b08020" stroke-width="0.8">
  <rect x="55" y="155" width="12" height="60"/>
  <rect x="52" y="152" width="18" height="6" rx="1"/>
  <rect x="52" y="210" width="18" height="4" rx="1"/>
  <rect x="75" y="168" width="10" height="47"/>
  <rect x="73" y="165" width="14" height="5" rx="1"/>
  <rect x="73" y="211" width="14" height="4" rx="1"/>
  <rect x="118" y="160" width="10" height="55"/>
  <rect x="116" y="157" width="14" height="5" rx="1"/>
  <rect x="116" y="211" width="14" height="4" rx="1"/>
  <rect x="132" y="150" width="12" height="65"/>
  <rect x="130" y="147" width="16" height="6" rx="1"/>
  <rect x="130" y="212" width="16" height="3" rx="1"/>
</g>
<!-- lintel -->
<rect x="50" y="148" width="44" height="7" rx="2" fill="#d4aa40" stroke="#a07818" stroke-width="0.7"/>
<rect x="114" y="145" width="32" height="7" rx="2" fill="#d4aa40" stroke="#a07818" stroke-width="0.7"/>
<!-- clouds -->
<g fill="#fff8e0" opacity="0.7">
  <ellipse cx="30" cy="72" rx="18" ry="7"/><ellipse cx="44" cy="68" rx="14" ry="8"/><ellipse cx="18" cy="70" rx="11" ry="5"/>
  <ellipse cx="168" cy="78" rx="16" ry="6"/><ellipse cx="180" cy="74" rx="12" ry="7"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#ffd060" stroke-width="0.7" stroke-opacity="0.5"/>
<g fill="#d4a830" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.5)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#ffd080" letter-spacing="2.5">FIELDS</text>
</svg>`);

// Gilded Red — bronze volcano
write('gilded', 'red', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a0800"/><stop offset="60%" stop-color="#7a3000"/><stop offset="100%" stop-color="#cc6010"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="100%" r="55%">
    <stop offset="0%" stop-color="#ff9020" stop-opacity="0.85"/><stop offset="100%" stop-color="#cc4000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(20,5,0,0.6)"/>
  </radialGradient>
  <linearGradient id="lava" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffb030"/><stop offset="100%" stop-color="#cc4000"/>
  </linearGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e06010"/><stop offset="100%" stop-color="#602000"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<path d="M0 198 L28 148 L55 172 L80 118 L100 78 L120 118 L145 172 L172 148 L200 198 L200 280 L0 280 Z" fill="#2a1000"/>
<path d="M0 220 L25 182 L52 198 L82 148 L100 112 L118 148 L148 198 L175 182 L200 220 L200 280 L0 280 Z" fill="#3a1800"/>
<path d="M96 118 Q98 148 93 175 Q100 195 107 175 Q102 148 104 118 Z" fill="url(#lava)" opacity="0.9"/>
<path d="M93 160 Q78 168 65 178 Q58 188 65 195 Q78 188 91 178 Q94 170 93 164 Z" fill="url(#lava)" opacity="0.65"/>
<path d="M107 160 Q122 168 135 178 Q142 188 135 195 Q122 188 109 178 Q106 170 107 164 Z" fill="url(#lava)" opacity="0.65"/>
<ellipse cx="100" cy="250" rx="58" ry="12" fill="#cc4000" opacity="0.65"/>
<ellipse cx="100" cy="250" rx="36" ry="7" fill="#ff7010" opacity="0.55"/>
<rect x="0" y="256" width="200" height="24" fill="url(#glow)" opacity="0.65"/>
<g fill="#ffaa30" opacity="0.8">
  <circle cx="90" cy="88" r="1.3"/><circle cx="112" cy="76" r="1.5"/><circle cx="78" cy="68" r="1"/><circle cx="124" cy="65" r="1.3"/>
  <circle cx="96" cy="60" r="0.9"/><circle cx="107" cy="56" r="1.2"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#e06010" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#c04010" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#ffa060" letter-spacing="2.5">PEAKS</text>
</svg>`);

// Gilded Blue — amber sunset ocean
write('gilded', 'blue', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2a1400"/><stop offset="45%" stop-color="#b04000"/><stop offset="75%" stop-color="#e07820"/><stop offset="100%" stop-color="#c05010"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#cc5010"/><stop offset="100%" stop-color="#601800"/>
  </linearGradient>
  <radialGradient id="sg" cx="50%" cy="58%" r="30%">
    <stop offset="0%" stop-color="#ff9020" stop-opacity="0.8"/><stop offset="100%" stop-color="#cc4000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(40,10,0,0.55)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e07830"/><stop offset="100%" stop-color="#803010"/>
  </linearGradient>
  <linearGradient id="ref" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff9020" stop-opacity="0.45"/><stop offset="100%" stop-color="#cc4000" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<!-- sunset sun -->
<ellipse cx="100" cy="162" rx="42" ry="42" fill="url(#sg)"/>
<circle cx="100" cy="162" r="18" fill="#ffe060" opacity="0.95"/>
<circle cx="100" cy="162" r="14" fill="#ffb830"/>
<!-- horizon clouds -->
<g fill="#e06820" opacity="0.6">
  <ellipse cx="30" cy="135" rx="22" ry="8"/><ellipse cx="46" cy="130" rx="16" ry="9"/>
  <ellipse cx="165" cy="140" rx="20" ry="7"/><ellipse cx="178" cy="136" rx="14" ry="8"/>
</g>
<path d="M0 172 Q50 164 100 168 Q150 172 200 165 L200 172 Z" fill="#601800"/>
<rect x="0" y="172" width="200" height="108" fill="url(#sea)"/>
<path d="M85 172 L115 172 L125 280 L75 280 Z" fill="url(#ref)" opacity="0.4"/>
<g stroke="#cc5010" stroke-width="1" fill="none" opacity="0.5">
  <path d="M5 182 Q28 178 52 182 Q76 186 100 182 Q124 178 148 182 Q172 186 196 182"/>
  <path d="M0 196 Q25 192 50 196 Q75 200 100 196 Q125 192 150 196 Q175 200 200 196"/>
  <path d="M5 212 Q30 207 58 212 Q86 217 114 212 Q142 207 170 212 Q186 215 200 212"/>
</g>
<g stroke="#e06820" stroke-width="1.2" fill="none" opacity="0.45">
  <path d="M0 228 Q26 223 52 228 Q78 233 104 228 Q130 223 156 228 Q178 232 200 228"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#e07830" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#b05820" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="62" y="257" width="76" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#ffb070" letter-spacing="2.5">SHORES</text>
</svg>`);

// Gilded Green — golden autumn forest
write('gilded', 'green', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a1000"/><stop offset="50%" stop-color="#4a2c00"/><stop offset="100%" stop-color="#7a4800"/>
  </linearGradient>
  <radialGradient id="lp" cx="50%" cy="42%" r="35%">
    <stop offset="0%" stop-color="#ffc030" stop-opacity="0.35"/><stop offset="100%" stop-color="#804000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(30,12,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#d09020"/><stop offset="100%" stop-color="#704800"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="118" rx="55" ry="55" fill="url(#lp)"/>
<!-- light shafts -->
<polygon points="82,0 88,160 112,160 118,0" fill="rgba(255,180,40,0.06)"/>
<polygon points="48,0 42,160 65,160 74,0" fill="rgba(240,160,20,0.04)"/>
<!-- far trees orange/amber -->
<g fill="#2a1400" opacity="0.9">
  <rect x="8" y="88" width="10" height="112"/><ellipse cx="13" cy="86" rx="14" ry="22" fill="#4a2800"/>
  <rect x="26" y="98" width="8" height="102"/><ellipse cx="30" cy="96" rx="12" ry="18" fill="#3a2000"/>
  <rect x="164" y="90" width="10" height="110"/><ellipse cx="169" cy="88" rx="14" ry="21" fill="#4a2800"/>
  <rect x="182" y="100" width="8" height="100"/><ellipse cx="186" cy="98" rx="11" ry="17" fill="#3a2000"/>
</g>
<!-- mid trees amber foliage -->
<g>
  <rect x="55" y="78" width="12" height="132" fill="#1e0e00"/>
  <ellipse cx="61" cy="74" rx="20" ry="30" fill="#8a4010"/><ellipse cx="61" cy="58" rx="14" ry="20" fill="#aa5818"/>
  <rect x="128" y="80" width="12" height="130" fill="#1e0e00"/>
  <ellipse cx="134" cy="76" rx="20" ry="30" fill="#8a4010"/><ellipse cx="134" cy="60" rx="14" ry="20" fill="#aa5818"/>
</g>
<!-- near trees rich amber -->
<g>
  <rect x="12" y="58" width="16" height="222" fill="#180a00"/>
  <ellipse cx="20" cy="52" rx="26" ry="40" fill="#c06418"/><ellipse cx="20" cy="34" rx="18" ry="26" fill="#d87c28"/>
  <rect x="172" y="60" width="16" height="220" fill="#180a00"/>
  <ellipse cx="180" cy="54" rx="26" ry="40" fill="#c06418"/><ellipse cx="180" cy="36" rx="18" ry="26" fill="#d87c28"/>
</g>
<!-- centre tree -->
<rect x="92" y="146" width="16" height="134" fill="#140800"/>
<ellipse cx="100" cy="142" rx="28" ry="42" fill="#6a3808"/><ellipse cx="100" cy="122" rx="20" ry="28" fill="#8a5010"/>
<!-- falling leaves -->
<g fill="#e08820" opacity="0.65">
  <ellipse cx="70" cy="108" rx="3" ry="1.5" transform="rotate(-20,70,108)"/>
  <ellipse cx="132" cy="116" rx="3" ry="1.5" transform="rotate(15,132,116)"/>
  <ellipse cx="88" cy="88" rx="2.5" ry="1.2" transform="rotate(30,88,88)"/>
  <ellipse cx="114" cy="98" rx="3" ry="1.4" transform="rotate(-10,114,98)"/>
  <ellipse cx="54" cy="132" rx="2.5" ry="1.2" transform="rotate(40,54,132)"/>
  <ellipse cx="148" cy="126" rx="3" ry="1.5" transform="rotate(-25,148,126)"/>
</g>
<!-- floor -->
<path d="M0 242 Q50 228 100 236 Q150 244 200 230 L200 280 L0 280 Z" fill="#3a1e00"/>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#d09020" stroke-width="0.7" stroke-opacity="0.4"/>
<g fill="#a06820" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#e0a840" letter-spacing="2.5">WOODS</text>
</svg>`);

// Gilded Black — bronze cursed ruins
write('gilded', 'black', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a0600"/><stop offset="55%" stop-color="#180e00"/><stop offset="100%" stop-color="#2a1800"/>
  </linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#241400"/><stop offset="100%" stop-color="#0e0800"/>
  </linearGradient>
  <radialGradient id="moon" cx="68%" cy="28%" r="22%">
    <stop offset="0%" stop-color="#c08020" stop-opacity="0.75"/><stop offset="60%" stop-color="#805010" stop-opacity="0.2"/><stop offset="100%" stop-color="#2a1000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="wispa" cx="30%" cy="75%" r="18%">
    <stop offset="0%" stop-color="#e09020" stop-opacity="0.45"/><stop offset="100%" stop-color="#804000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(10,4,0,0.7)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#a06820"/><stop offset="100%" stop-color="#401800"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="136" cy="76" rx="32" ry="32" fill="url(#moon)"/>
<circle cx="136" cy="76" r="15" fill="#d4a030" opacity="0.9"/>
<circle cx="136" cy="76" r="13" fill="#c89020"/>
<circle cx="140" cy="73" r="11" fill="#0a0600" opacity="0.6"/>
<!-- dead trees bronze -->
<g fill="#140c00">
  <rect x="10" y="42" width="8" height="230"/><line x1="14" y1="65" x2="-2" y2="48" stroke="#2a1800" stroke-width="5"/><line x1="14" y1="80" x2="32" y2="62" stroke="#2a1800" stroke-width="4"/><line x1="14" y1="100" x2="0" y2="88" stroke="#2a1800" stroke-width="3"/>
  <rect x="178" y="46" width="8" height="226"/><line x1="182" y1="68" x2="200" y2="52" stroke="#2a1800" stroke-width="5"/><line x1="182" y1="84" x2="164" y2="66" stroke="#2a1800" stroke-width="4"/><line x1="182" y1="104" x2="196" y2="92" stroke="#2a1800" stroke-width="3"/>
  <rect x="97" y="130" width="6" height="150"/><line x1="100" y1="148" x2="86" y2="136" stroke="#2a1800" stroke-width="3"/><line x1="100" y1="162" x2="114" y2="150" stroke="#2a1800" stroke-width="2.5"/>
</g>
<!-- ruined arches -->
<g fill="none" stroke="#4a2c00" stroke-width="2" stroke-linecap="round" opacity="0.7">
  <path d="M40 215 L40 172 Q55 155 70 172 L70 215"/>
  <path d="M130 218 L130 175 Q145 158 160 175 L160 218"/>
</g>
<path d="M0 172 Q50 164 100 168 Q150 174 200 165 L200 175 Q150 183 100 178 Q50 173 0 180 Z" fill="#1a0c00" opacity="0.7"/>
<rect x="0" y="175" width="200" height="105" fill="url(#water)"/>
<ellipse cx="60" cy="210" rx="28" ry="16" fill="url(#wispa)"/>
<!-- wisp dots -->
<circle cx="58" cy="204" r="3" fill="#e09020" opacity="0.75"/>
<circle cx="62" cy="208" r="1.5" fill="#ffc040" opacity="0.8"/>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#a06820" stroke-width="0.7" stroke-opacity="0.4"/>
<g fill="#6a3810" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.6)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#c08830" letter-spacing="2.5">MARSH</text>
</svg>`);

// Gilded Back — gold mandala
write('gilded', 'back', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1a1000"/><stop offset="50%" stop-color="#0e0a00"/><stop offset="100%" stop-color="#060400"/>
  </linearGradient>
  <radialGradient id="cg" cx="50%" cy="50%" r="38%">
    <stop offset="0%" stop-color="#c08020" stop-opacity="0.5"/><stop offset="100%" stop-color="#0e0800" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e0a020"/><stop offset="100%" stop-color="#604010"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#bg)" rx="10"/>
<g fill="#c09020" opacity="0.3">
  <circle cx="18" cy="22" r="0.8"/><circle cx="45" cy="16" r="0.6"/><circle cx="72" cy="30" r="0.9"/>
  <circle cx="130" cy="18" r="0.7"/><circle cx="158" cy="28" r="0.8"/><circle cx="182" cy="14" r="0.6"/>
  <circle cx="24" cy="240" r="0.7"/><circle cx="178" cy="248" r="0.8"/><circle cx="192" cy="260" r="0.6"/>
</g>
<ellipse cx="100" cy="140" rx="68" ry="68" fill="url(#cg)"/>
<circle cx="100" cy="140" r="60" fill="none" stroke="#8a6010" stroke-width="1.2" stroke-opacity="0.7"/>
<circle cx="100" cy="140" r="55" fill="none" stroke="#c09020" stroke-width="0.6" stroke-opacity="0.5"/>
<!-- 8-pointed gold star -->
<polygon points="100,82 107,118 140,108 118,132 140,172 107,162 100,198 93,162 60,172 82,132 60,108 93,118"
         fill="#8a6010" fill-opacity="0.22" stroke="#c09020" stroke-width="1.2" stroke-opacity="0.75"/>
<polygon points="100,96 104,120 126,114 112,130 126,160 104,154 100,178 96,154 74,160 88,130 74,114 96,120"
         fill="none" stroke="#e0b830" stroke-width="0.8" stroke-opacity="0.5"/>
<circle cx="100" cy="140" r="18" fill="#0e0800" stroke="#c09020" stroke-width="1.4"/>
<circle cx="100" cy="140" r="12" fill="none" stroke="#e0c840" stroke-width="0.7" stroke-opacity="0.7"/>
<!-- cross ticks -->
<g stroke="#c09020" stroke-width="1.2" stroke-linecap="round" opacity="0.65">
  <line x1="100" y1="80" x2="100" y2="87"/><line x1="160" y1="140" x2="153" y2="140"/>
  <line x1="100" y1="200" x2="100" y2="193"/><line x1="40" y1="140" x2="47" y2="140"/>
  <line x1="142" y1="98" x2="137" y2="103"/><line x1="142" y1="182" x2="137" y2="177"/>
  <line x1="58" y1="182" x2="63" y2="177"/><line x1="58" y1="98" x2="63" y2="103"/>
</g>
<g stroke="#8a6010" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.75">
  <path d="M14 14 L14 28 M14 14 L28 14"/><path d="M186 14 L186 28 M186 14 L172 14"/>
  <path d="M14 266 L14 252 M14 266 L28 266"/><path d="M186 266 L186 252 M186 266 L172 266"/>
</g>
<rect x="18" y="18" width="164" height="244" rx="5" fill="none" stroke="#6a4808" stroke-width="0.8" stroke-opacity="0.4"/>
<g fill="#a07818" opacity="0.7"><circle cx="26" cy="26" r="2"/><circle cx="174" cy="26" r="2"/><circle cx="26" cy="254" r="2"/><circle cx="174" cy="254" r="2"/></g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
</svg>`);

// Gilded preview
write('gilded', 'preview', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2a1400"/><stop offset="100%" stop-color="#0e0800"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#c08020" stop-opacity="0.4"/><stop offset="100%" stop-color="#0e0800" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="200" height="130" fill="url(#bg)" rx="8"/>
<ellipse cx="100" cy="65" rx="85" ry="55" fill="url(#glow)"/>
<!-- mini card previews -->
<rect x="18" y="22" width="28" height="40" rx="4" fill="#7a4800"/><rect x="18" y="22" width="28" height="40" rx="4" fill="none" stroke="#c09020" stroke-width="1.2"/>
<rect x="52" y="22" width="28" height="40" rx="4" fill="#4a1800"/><rect x="52" y="22" width="28" height="40" rx="4" fill="none" stroke="#c06010" stroke-width="1.2"/>
<rect x="86" y="22" width="28" height="40" rx="4" fill="#3a1200"/><rect x="86" y="22" width="28" height="40" rx="4" fill="none" stroke="#e07820" stroke-width="1.2"/>
<rect x="120" y="22" width="28" height="40" rx="4" fill="#2a1000"/><rect x="120" y="22" width="28" height="40" rx="4" fill="none" stroke="#d09020" stroke-width="1.2"/>
<rect x="154" y="22" width="28" height="40" rx="4" fill="#1a0a00"/><rect x="154" y="22" width="28" height="40" rx="4" fill="none" stroke="#a06820" stroke-width="1.2"/>
<!-- color swatches in cards -->
<circle cx="32" cy="42" r="6" fill="#d4a030"/><circle cx="66" cy="42" r="6" fill="#cc4010"/><circle cx="100" cy="42" r="6" fill="#e07820"/><circle cx="134" cy="42" r="6" fill="#c06818"/><circle cx="168" cy="42" r="6" fill="#8a5010"/>
<text x="100" y="92" font-size="13" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#e0a020" letter-spacing="3">GILDED</text>
<text x="100" y="110" font-size="7.5" font-family="Georgia,serif" text-anchor="middle" fill="#8a6010" letter-spacing="1.5">WARM GOLD &amp; AMBER</text>
</svg>`);

// ═════════════════════════════════════════════════════════════════════════════
//  PACK: OBSIDIAN — dark crystal / geometric art
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n── OBSIDIAN ──');

// Helper: crystal facet polygon at position
function crystals(color, accent, bgColor) {
  return `
<!-- crystal cluster -->
<g fill="${bgColor}" stroke="${color}" stroke-width="0.8" stroke-opacity="0.5">
  <polygon points="88,90 100,60 112,90 100,95"/>
  <polygon points="72,110 88,74 100,95 80,118"/>
  <polygon points="128,110 112,74 100,95 120,118"/>
  <polygon points="88,90 100,95 104,128 84,122"/>
  <polygon points="112,90 100,95 96,128 116,122"/>
</g>
<g fill="${accent}" stroke="${color}" stroke-width="0.6" stroke-opacity="0.6" opacity="0.55">
  <polygon points="96,68 100,60 104,68 100,72"/>
  <polygon points="78,105 82,92 88,90 82,110"/>
  <polygon points="122,105 118,92 112,90 118,110"/>
</g>`;
}

// Obsidian White — white crystal cavern
write('obsidian', 'white', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a0c14"/><stop offset="55%" stop-color="#141c28"/><stop offset="100%" stop-color="#1c2838"/>
  </linearGradient>
  <radialGradient id="gc" cx="50%" cy="40%" r="35%">
    <stop offset="0%" stop-color="#c8d8f0" stop-opacity="0.35"/><stop offset="100%" stop-color="#0a0c14" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#c0cce0"/><stop offset="100%" stop-color="#4060a0"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="112" rx="60" ry="60" fill="url(#gc)"/>
<!-- stalagmite/stalactite silhouettes -->
<g fill="#060810" opacity="0.85">
  <polygon points="0,280 0,210 15,240 30,200 45,235 60,208 75,245 90,215 100,245 110,215 125,245 140,208 155,235 170,200 185,240 200,210 200,280"/>
  <polygon points="0,0 0,60 12,30 28,55 40,20 56,50 70,18 85,45 100,15 115,45 130,18 144,50 160,20 176,55 188,30 200,60 200,0"/>
</g>
${crystals('#c8d8f0', '#e8f0ff', '#101828')}
<!-- floor reflection sheen -->
<path d="M0 240 Q50 232 100 238 Q150 244 200 234 L200 280 L0 280 Z" fill="#141c2a" opacity="0.8"/>
<g fill="#c0ccdc" opacity="0.15">
  <polygon points="92,248 100,234 108,248 100,252"/>
  <polygon points="82,254 88,244 94,254 88,257"/>
  <polygon points="106,254 112,244 118,254 112,257"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#c0cce0" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#6080b0" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#c8d8f0" letter-spacing="2.5">FIELDS</text>
</svg>`);

// Obsidian Red — red crystal volcanic
write('obsidian', 'red', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0a0000"/><stop offset="55%" stop-color="#200400"/><stop offset="100%" stop-color="#380600"/>
  </linearGradient>
  <radialGradient id="gc" cx="50%" cy="40%" r="35%">
    <stop offset="0%" stop-color="#e04020" stop-opacity="0.38"/><stop offset="100%" stop-color="#0a0000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e04020"/><stop offset="100%" stop-color="#600808"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="112" rx="60" ry="60" fill="url(#gc)"/>
<g fill="#060000" opacity="0.85">
  <polygon points="0,280 0,218 18,248 36,210 52,240 68,212 85,248 100,220 115,248 132,212 148,240 164,210 180,248 200,218 200,280"/>
  <polygon points="0,0 0,55 14,28 30,52 44,18 60,48 74,15 90,44 100,12 110,44 126,15 140,48 156,18 170,52 184,28 200,55 200,0"/>
</g>
${crystals('#e04020', '#ff6040', '#200400').replace('#101828', '#200400')}
<path d="M0 240 Q50 232 100 238 Q150 244 200 234 L200 280 L0 280 Z" fill="#200400" opacity="0.8"/>
<g fill="#e04020" opacity="0.12">
  <polygon points="92,248 100,234 108,248 100,252"/>
  <polygon points="82,254 88,244 94,254 88,257"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#e04020" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#800808" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#f06040" letter-spacing="2.5">PEAKS</text>
</svg>`);

// Obsidian Blue — teal crystal underwater
write('obsidian', 'blue', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#000a0e"/><stop offset="55%" stop-color="#001828"/><stop offset="100%" stop-color="#002038"/>
  </linearGradient>
  <radialGradient id="gc" cx="50%" cy="40%" r="35%">
    <stop offset="0%" stop-color="#20b8d0" stop-opacity="0.35"/><stop offset="100%" stop-color="#000a0e" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#20c0d8"/><stop offset="100%" stop-color="#005060"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="112" rx="60" ry="60" fill="url(#gc)"/>
<g fill="#000608" opacity="0.85">
  <polygon points="0,280 0,218 18,248 36,210 52,240 68,212 85,248 100,220 115,248 132,212 148,240 164,210 180,248 200,218 200,280"/>
  <polygon points="0,0 0,55 14,28 30,52 44,18 60,48 74,15 90,44 100,12 110,44 126,15 140,48 156,18 170,52 184,28 200,55 200,0"/>
</g>
${crystals('#20c0d8', '#60e0f0', '#001828').replace('#101828', '#001828')}
<path d="M0 240 Q50 232 100 238 Q150 244 200 234 L200 280 L0 280 Z" fill="#001828" opacity="0.8"/>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#20c0d8" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#006880" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="62" y="257" width="76" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#60d8e8" letter-spacing="2.5">SHORES</text>
</svg>`);

// Obsidian Green — emerald crystal
write('obsidian', 'green', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#000a00"/><stop offset="55%" stop-color="#001800"/><stop offset="100%" stop-color="#002800"/>
  </linearGradient>
  <radialGradient id="gc" cx="50%" cy="40%" r="35%">
    <stop offset="0%" stop-color="#20d060" stop-opacity="0.35"/><stop offset="100%" stop-color="#000a00" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#40d070"/><stop offset="100%" stop-color="#005020"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="112" rx="60" ry="60" fill="url(#gc)"/>
<g fill="#000600" opacity="0.85">
  <polygon points="0,280 0,218 18,248 36,210 52,240 68,212 85,248 100,220 115,248 132,212 148,240 164,210 180,248 200,218 200,280"/>
  <polygon points="0,0 0,55 14,28 30,52 44,18 60,48 74,15 90,44 100,12 110,44 126,15 140,48 156,18 170,52 184,28 200,55 200,0"/>
</g>
${crystals('#40d070', '#80f0a0', '#001800').replace('#101828', '#001800')}
<path d="M0 240 Q50 232 100 238 Q150 244 200 234 L200 280 L0 280 Z" fill="#001800" opacity="0.8"/>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#40d070" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#006030" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.55)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#70e890" letter-spacing="2.5">WOODS</text>
</svg>`);

// Obsidian Black — void crystal
write('obsidian', 'black', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#000000"/><stop offset="55%" stop-color="#040008"/><stop offset="100%" stop-color="#080010"/>
  </linearGradient>
  <radialGradient id="gc" cx="50%" cy="40%" r="35%">
    <stop offset="0%" stop-color="#8040c0" stop-opacity="0.35"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8040c0"/><stop offset="100%" stop-color="#200840"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<ellipse cx="100" cy="112" rx="60" ry="60" fill="url(#gc)"/>
<g fill="#000000" opacity="0.9">
  <polygon points="0,280 0,218 18,248 36,210 52,240 68,212 85,248 100,220 115,248 132,212 148,240 164,210 180,248 200,218 200,280"/>
  <polygon points="0,0 0,55 14,28 30,52 44,18 60,48 74,15 90,44 100,12 110,44 126,15 140,48 156,18 170,52 184,28 200,55 200,0"/>
</g>
${crystals('#8040c0', '#c080f0', '#040008').replace('#101828', '#040008')}
<!-- crack lines on floor -->
<g stroke="#8040c0" stroke-width="0.7" stroke-opacity="0.35" stroke-linecap="round">
  <line x1="60" y1="248" x2="80" y2="268"/><line x1="80" y1="268" x2="90" y2="262"/>
  <line x1="120" y1="252" x2="140" y2="272"/><line x1="140" y1="272" x2="148" y2="260"/>
</g>
<path d="M0 240 Q50 232 100 238 Q150 244 200 234 L200 280 L0 280 Z" fill="#040008" opacity="0.9"/>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
<rect x="9" y="9" width="182" height="262" rx="6" fill="none" stroke="#8040c0" stroke-width="0.7" stroke-opacity="0.45"/>
<g fill="#401880" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="58" y="257" width="84" height="16" rx="4" fill="rgba(0,0,0,0.6)"/>
<text x="100" y="268.5" font-size="8.5" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#c080f0" letter-spacing="2.5">MARSH</text>
</svg>`);

// Obsidian Back — dark faceted gem
write('obsidian', 'back', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#050410"/><stop offset="50%" stop-color="#030208"/><stop offset="100%" stop-color="#010104"/>
  </linearGradient>
  <radialGradient id="cg" cx="50%" cy="50%" r="38%">
    <stop offset="0%" stop-color="#6040b0" stop-opacity="0.4"/><stop offset="100%" stop-color="#030208" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8060d0"/><stop offset="100%" stop-color="#201040"/>
  </linearGradient>
</defs>
<rect width="200" height="280" fill="url(#bg)" rx="10"/>
<ellipse cx="100" cy="140" rx="70" ry="70" fill="url(#cg)"/>
<!-- large central gem shape -->
<polygon points="100,70 142,100 155,140 142,180 100,210 58,180 45,140 58,100"
         fill="#080618" stroke="#6040b0" stroke-width="1" stroke-opacity="0.65"/>
<polygon points="100,82 134,108 144,140 134,172 100,198 66,172 56,140 66,108"
         fill="none" stroke="#9060d0" stroke-width="0.7" stroke-opacity="0.5"/>
<!-- facet lines from centre -->
<g stroke="#7050b8" stroke-width="0.8" stroke-opacity="0.4">
  <line x1="100" y1="140" x2="100" y2="70"/><line x1="100" y1="140" x2="142" y2="100"/>
  <line x1="100" y1="140" x2="155" y2="140"/><line x1="100" y1="140" x2="142" y2="180"/>
  <line x1="100" y1="140" x2="100" y2="210"/><line x1="100" y1="140" x2="58" y2="180"/>
  <line x1="100" y1="140" x2="45" y2="140"/><line x1="100" y1="140" x2="58" y2="100"/>
</g>
<circle cx="100" cy="140" r="8" fill="#0a0818" stroke="#a080e0" stroke-width="1.2"/>
<circle cx="100" cy="140" r="4" fill="#6040b0" opacity="0.5"/>
<g stroke="#4030808" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.7">
  <path d="M14 14 L14 28 M14 14 L28 14"/><path d="M186 14 L186 28 M186 14 L172 14"/>
  <path d="M14 266 L14 252 M14 266 L28 266"/><path d="M186 266 L186 252 M186 266 L172 266"/>
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2.5"/>
</svg>`);

// Obsidian preview
write('obsidian', 'preview', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#050410"/><stop offset="100%" stop-color="#010104"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="55%">
    <stop offset="0%" stop-color="#6040b0" stop-opacity="0.35"/><stop offset="100%" stop-color="#030208" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="200" height="130" fill="url(#bg)" rx="8"/>
<ellipse cx="100" cy="65" rx="85" ry="55" fill="url(#glow)"/>
<rect x="18" y="22" width="28" height="40" rx="4" fill="#101828"/><rect x="18" y="22" width="28" height="40" rx="4" fill="none" stroke="#c0d0e4" stroke-width="1.2"/>
<rect x="52" y="22" width="28" height="40" rx="4" fill="#200400"/><rect x="52" y="22" width="28" height="40" rx="4" fill="none" stroke="#e04020" stroke-width="1.2"/>
<rect x="86" y="22" width="28" height="40" rx="4" fill="#001828"/><rect x="86" y="22" width="28" height="40" rx="4" fill="none" stroke="#20c0d8" stroke-width="1.2"/>
<rect x="120" y="22" width="28" height="40" rx="4" fill="#001800"/><rect x="120" y="22" width="28" height="40" rx="4" fill="none" stroke="#40d070" stroke-width="1.2"/>
<rect x="154" y="22" width="28" height="40" rx="4" fill="#040008"/><rect x="154" y="22" width="28" height="40" rx="4" fill="none" stroke="#8040c0" stroke-width="1.2"/>
<!-- tiny crystal in each card -->
<polygon points="32,35 36,28 40,35 36,38" fill="#c0d0e4" opacity="0.6"/>
<polygon points="66,35 70,28 74,35 70,38" fill="#e04020" opacity="0.6"/>
<polygon points="100,35 104,28 108,35 104,38" fill="#20c0d8" opacity="0.6"/>
<polygon points="134,35 138,28 142,35 138,38" fill="#40d070" opacity="0.6"/>
<polygon points="168,35 172,28 176,35 172,38" fill="#8040c0" opacity="0.6"/>
<text x="100" y="92" font-size="13" font-family="Georgia,serif" font-weight="bold" text-anchor="middle" fill="#9070d8" letter-spacing="3">OBSIDIAN</text>
<text x="100" y="110" font-size="7.5" font-family="Georgia,serif" text-anchor="middle" fill="#4030808" letter-spacing="1.5">DARK CRYSTAL GEOMETRY</text>
</svg>`);

// ═════════════════════════════════════════════════════════════════════════════
//  PACK: NEON — synthwave / cyberpunk
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n── NEON ──');

function neonBase(accent1, accent2, labelColor, labelText) {
  return { accent1, accent2, labelColor, labelText };
}

function neonCard(accent, accent2, terrain, labelText) {
  const gridLines = Array.from({ length: 14 }, (_, i) => {
    const y = 140 + i * 12;
    const perspective = 1 - (i / 14) * 0.7;
    const xOff = (1 - perspective) * 100;
    return `<line x1="${xOff}" y1="${y}" x2="${200 - xOff}" y2="${y}" stroke="${accent}" stroke-width="0.7" stroke-opacity="${0.15 + i * 0.03}"/>`;
  }).join('\n');

  const vLines = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x1 = 100 + (t - 0.5) * 200;
    return `<line x1="${100}" y1="140" x2="${x1}" y2="280" stroke="${accent}" stroke-width="0.7" stroke-opacity="0.18"/>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#020008"/><stop offset="55%" stop-color="#060012"/><stop offset="100%" stop-color="#08001a"/>
  </linearGradient>
  <radialGradient id="hor" cx="50%" cy="50%" r="45%">
    <stop offset="0%" stop-color="${accent}" stop-opacity="0.4"/><stop offset="100%" stop-color="#020008" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="70%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${accent2}"/>
  </linearGradient>
  <filter id="glow">
    <feGaussianBlur stdDeviation="2.5" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect width="200" height="280" fill="url(#s)" rx="10"/>
<!-- horizon glow -->
<ellipse cx="100" cy="140" rx="90" ry="40" fill="url(#hor)"/>
<!-- perspective grid -->
${gridLines}
${vLines}
<!-- horizon line -->
<line x1="0" y1="140" x2="200" y2="140" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.6"/>
<!-- terrain silhouette -->
${terrain}
<!-- scan lines -->
<g opacity="0.06">
${Array.from({ length: 35 }, (_, i) => `  <line x1="0" y1="${i * 8}" x2="200" y2="${i * 8}" stroke="white" stroke-width="0.5"/>`).join('\n')}
</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<!-- neon frame -->
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2" filter="url(#glow)"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="${accent}" stroke-width="0.6" stroke-opacity="0.8"/>
<g fill="${accent}" opacity="0.9"><polygon points="9,9 20,9 9,20"/><polygon points="191,9 180,9 191,20"/><polygon points="9,271 20,271 9,260"/><polygon points="191,271 180,271 191,260"/></g>
<rect x="52" y="257" width="96" height="16" rx="4" fill="rgba(0,0,0,0.6)"/>
<text x="100" y="268.5" font-size="8.5" font-family="'Courier New',monospace" font-weight="bold" text-anchor="middle" fill="${accent}" letter-spacing="2.5">${labelText}</text>
</svg>`;
}

// Neon White — cyan plains
write('neon', 'white', neonCard('#00f0e0', '#006858',
  `<g fill="#00f0e0" opacity="0.12">
    <polygon points="0,140 0,120 30,128 60,115 90,122 100,118 110,122 140,115 170,128 200,120 200,140"/>
  </g>
  <g fill="#00f0e0" opacity="0.07">
    <polygon points="0,140 0,110 25,120 50,106 80,115 100,110 120,115 150,106 175,120 200,110 200,140"/>
  </g>
  <!-- neon city horizon shapes -->
  <g fill="none" stroke="#00f0e0" stroke-width="0.8" stroke-opacity="0.35">
    <rect x="20" y="88" width="12" height="52"/><rect x="36" y="96" width="8" height="44"/>
    <rect x="160" y="90" width="12" height="50"/><rect x="148" y="100" width="8" height="40"/>
    <rect x="80" y="78" width="16" height="62"/><rect x="102" y="84" width="14" height="56"/>
  </g>
  <!-- glowing sun circle -->
  <circle cx="100" cy="95" r="20" fill="none" stroke="#00f0e0" stroke-width="1.2" stroke-opacity="0.7" filter="url(#glow)"/>
  <circle cx="100" cy="95" r="15" fill="none" stroke="#00f0e0" stroke-width="0.6" stroke-opacity="0.4"/>
  <circle cx="100" cy="95" r="4" fill="#00f0e0" opacity="0.6"/>`,
  'FIELDS'
));

// Neon Red — magenta mountain
write('neon', 'red', neonCard('#ff0060', '#880020',
  `<!-- mountain silhouettes neon outline -->
  <polyline points="0,140 30,95 55,118 80,72 100,50 120,72 145,118 170,95 200,140"
            fill="none" stroke="#ff0060" stroke-width="1.5" stroke-opacity="0.55" filter="url(#glow)"/>
  <polyline points="0,140 30,95 55,118 80,72 100,50 120,72 145,118 170,95 200,140"
            fill="none" stroke="#ff0060" stroke-width="0.6" stroke-opacity="0.8"/>
  <!-- inner mountain fill -->
  <polygon points="0,140 30,95 55,118 80,72 100,50 120,72 145,118 170,95 200,140 200,141 0,141"
            fill="#ff0060" fill-opacity="0.06"/>
  <!-- lava drip neon -->
  <line x1="100" y1="54" x2="100" y2="140" stroke="#ff4000" stroke-width="1.5" stroke-opacity="0.5" filter="url(#glow)"/>
  <!-- summit glow -->
  <circle cx="100" cy="50" r="6" fill="none" stroke="#ff8040" stroke-width="1.2" stroke-opacity="0.7" filter="url(#glow)"/>
  <circle cx="100" cy="50" r="2" fill="#ff8040" opacity="0.8"/>`,
  'PEAKS'
));

// Neon Blue — electric ocean
write('neon', 'blue', neonCard('#0080ff', '#002880',
  `<!-- neon moon -->
  <circle cx="100" cy="80" r="22" fill="none" stroke="#0080ff" stroke-width="1.5" stroke-opacity="0.7" filter="url(#glow)"/>
  <circle cx="100" cy="80" r="16" fill="none" stroke="#0080ff" stroke-width="0.6" stroke-opacity="0.5"/>
  <circle cx="100" cy="80" r="5"  fill="#0080ff" opacity="0.55"/>
  <!-- reflected line on water -->
  <line x1="100" y1="140" x2="100" y2="280" stroke="#0080ff" stroke-width="1.5" stroke-opacity="0.25" filter="url(#glow)"/>
  <!-- wave lines -->
  <g stroke="#0080ff" stroke-width="0.9" fill="none" stroke-opacity="0.4" filter="url(#glow)">
    <path d="M20,152 Q40,148 60,152 Q80,156 100,152 Q120,148 140,152 Q160,156 180,152"/>
    <path d="M10,165 Q35,160 60,165 Q85,170 110,165 Q135,160 160,165 Q180,169 195,165"/>
    <path d="M5,180 Q30,174 58,180 Q86,186 114,180 Q142,174 170,180 Q185,184 200,180"/>
  </g>`,
  'SHORES'
));

// Neon Green — matrix forest
write('neon', 'green', neonCard('#00ff60', '#006028',
  `<!-- matrix rain columns -->
  <g fill="#00ff60" font-size="8" font-family="'Courier New',monospace" opacity="0.18">
    <text x="28"  y="80">1</text><text x="28"  y="92">0</text><text x="28"  y="104">1</text><text x="28"  y="116">1</text>
    <text x="60"  y="70">0</text><text x="60"  y="82">1</text><text x="60"  y="94">0</text><text x="60"  y="106">1</text><text x="60"  y="118">0</text>
    <text x="92"  y="60">1</text><text x="92"  y="72">0</text><text x="92"  y="84">1</text><text x="92"  y="96">0</text><text x="92"  y="108">1</text><text x="92"  y="120">0</text>
    <text x="124" y="68">0</text><text x="124" y="80">1</text><text x="124" y="92">1</text><text x="124" y="104">0</text><text x="124" y="116">1</text>
    <text x="156" y="78">1</text><text x="156" y="90">0</text><text x="156" y="102">1</text><text x="156" y="114">0</text>
  </g>
  <!-- tree outlines -->
  <g fill="none" stroke="#00ff60" stroke-width="1" stroke-opacity="0.5">
    <line x1="30" y1="140" x2="30" y2="88"/><path d="M16,110 Q30,88 44,110"/><path d="M12,98 Q30,76 48,98"/>
    <line x1="170" y1="140" x2="170" y2="90"/><path d="M156,112 Q170,90 184,112"/><path d="M152,100 Q170,78 188,100"/>
    <line x1="100" y1="140" x2="100" y2="68"/><path d="M82,100 Q100,68 118,100"/><path d="M76,88 Q100,56 124,88"/>
  </g>`,
  'WOODS'
));

// Neon Black — purple void swamp
write('neon', 'black', neonCard('#b000ff', '#480080',
  `<!-- dead neon tree outlines -->
  <g fill="none" stroke="#b000ff" stroke-width="1.2" stroke-opacity="0.55" filter="url(#glow)">
    <line x1="25" y1="280" x2="25" y2="68"/>
    <line x1="25" y1="88"  x2="6"  y2="70"/><line x1="25" y1="102" x2="48"  y2="84"/>
    <line x1="25" y1="118" x2="5"  y2="106"/>
    <line x1="175" y1="280" x2="175" y2="72"/>
    <line x1="175" y1="90"  x2="196" y2="72"/><line x1="175" y1="105" x2="152" y2="87"/>
    <line x1="175" y1="122" x2="194" y2="110"/>
    <line x1="100" y1="280" x2="100" y2="128"/>
    <line x1="100" y1="142" x2="82"  y2="130"/><line x1="100" y1="155" x2="118" y2="143"/>
  </g>
  <!-- swamp mist -->
  <ellipse cx="65"  cy="145" rx="35" ry="10" fill="#b000ff" fill-opacity="0.08" filter="url(#glow)"/>
  <ellipse cx="140" cy="150" rx="28" ry="8"  fill="#b000ff" fill-opacity="0.08" filter="url(#glow)"/>
  <!-- wisp dots -->
  <circle cx="60"  cy="143" r="3" fill="#b000ff" opacity="0.65" filter="url(#glow)"/>
  <circle cx="145" cy="148" r="2.5" fill="#d040ff" opacity="0.6" filter="url(#glow)"/>`,
  'MARSH'
));

// Neon Back — circuit board
write('neon', 'back', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#020008"/><stop offset="50%" stop-color="#040010"/><stop offset="100%" stop-color="#020008"/>
  </linearGradient>
  <radialGradient id="cg" cx="50%" cy="50%" r="40%">
    <stop offset="0%" stop-color="#6000c0" stop-opacity="0.35"/><stop offset="100%" stop-color="#020008" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="v" cx="50%" cy="50%" r="68%">
    <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
  </radialGradient>
  <linearGradient id="fr" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8000ff"/><stop offset="100%" stop-color="#3000808"/>
  </linearGradient>
  <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="200" height="280" fill="url(#bg)" rx="10"/>
<ellipse cx="100" cy="140" rx="75" ry="75" fill="url(#cg)"/>
<!-- circuit traces -->
<g stroke="#6000c0" stroke-width="1" fill="none" stroke-opacity="0.5">
  <!-- horizontal routes -->
  <polyline points="18,50 60,50 60,80 140,80 140,50 182,50"/>
  <polyline points="18,230 60,230 60,200 140,200 140,230 182,230"/>
  <polyline points="18,140 44,140 44,110 80,110 80,140 120,140 120,110 156,110 156,140 182,140"/>
  <!-- vertical routes -->
  <polyline points="50,18 50,44 80,44 80,18"/>
  <polyline points="120,18 120,44 150,44 150,18"/>
  <polyline points="50,262 50,236 80,236 80,262"/>
  <polyline points="120,262 120,236 150,236 150,262"/>
</g>
<!-- nodes / vias -->
<g fill="#8000ff" opacity="0.7">
  <circle cx="60" cy="80" r="3"/><circle cx="140" cy="80" r="3"/><circle cx="60" cy="200" r="3"/>
  <circle cx="140" cy="200" r="3"/><circle cx="80" cy="110" r="3"/><circle cx="120" cy="110" r="3"/>
  <circle cx="44" cy="140" r="3"/><circle cx="156" cy="140" r="3"/>
</g>
<!-- central chip -->
<rect x="74" y="114" width="52" height="52" rx="4" fill="#060018" stroke="#8000ff" stroke-width="1.2" stroke-opacity="0.8" filter="url(#glow)"/>
<rect x="80" y="120" width="40" height="40" rx="3" fill="none" stroke="#a040ff" stroke-width="0.7" stroke-opacity="0.5"/>
<!-- chip pin lines -->
<g stroke="#6000c0" stroke-width="1.5" stroke-opacity="0.5">
  <line x1="74" y1="126" x2="60" y2="126"/><line x1="74" y1="134" x2="60" y2="134"/>
  <line x1="74" y1="142" x2="60" y2="142"/><line x1="74" y1="150" x2="60" y2="150"/>
  <line x1="74" y1="158" x2="60" y2="158"/>
  <line x1="126" y1="126" x2="140" y2="126"/><line x1="126" y1="134" x2="140" y2="134"/>
  <line x1="126" y1="142" x2="140" y2="142"/><line x1="126" y1="150" x2="140" y2="150"/>
  <line x1="126" y1="158" x2="140" y2="158"/>
</g>
<circle cx="100" cy="140" r="10" fill="#060018" stroke="#a040ff" stroke-width="1" filter="url(#glow)"/>
<circle cx="100" cy="140" r="4" fill="#8000ff" opacity="0.7"/>
<!-- scan lines -->
<g opacity="0.06">${Array.from({ length: 35 }, (_, i) => `<line x1="0" y1="${i * 8}" x2="200" y2="${i * 8}" stroke="white" stroke-width="0.5"/>`).join('')}</g>
<rect width="200" height="280" fill="url(#v)" rx="10"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="url(#fr)" stroke-width="2" filter="url(#glow)"/>
<rect x="5" y="5" width="190" height="270" rx="8" fill="none" stroke="#8000ff" stroke-width="0.6" stroke-opacity="0.8"/>
</svg>`);

// Neon preview
write('neon', 'preview', `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="130" viewBox="0 0 200 130">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#020008"/><stop offset="100%" stop-color="#040010"/>
  </linearGradient>
  <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="200" height="130" fill="url(#bg)" rx="8"/>
<!-- grid lines -->
<g stroke="#8000ff" stroke-width="0.5" stroke-opacity="0.2">
  <line x1="0" y1="65" x2="200" y2="65"/>
  <line x1="0" y1="40" x2="200" y2="40"/><line x1="0" y1="90" x2="200" y2="90"/>
  <line x1="40" y1="0" x2="40" y2="130"/><line x1="80" y1="0" x2="80" y2="130"/>
  <line x1="120" y1="0" x2="120" y2="130"/><line x1="160" y1="0" x2="160" y2="130"/>
</g>
<!-- mini cards with neon borders -->
<rect x="18" y="18" width="28" height="40" rx="3" fill="#06001a"/><rect x="18" y="18" width="28" height="40" rx="3" fill="none" stroke="#00f0e0" stroke-width="1.5" filter="url(#glow)"/>
<rect x="52" y="18" width="28" height="40" rx="3" fill="#12000a"/><rect x="52" y="18" width="28" height="40" rx="3" fill="none" stroke="#ff0060" stroke-width="1.5" filter="url(#glow)"/>
<rect x="86" y="18" width="28" height="40" rx="3" fill="#00040e"/><rect x="86" y="18" width="28" height="40" rx="3" fill="none" stroke="#0080ff" stroke-width="1.5" filter="url(#glow)"/>
<rect x="120" y="18" width="28" height="40" rx="3" fill="#00060a"/><rect x="120" y="18" width="28" height="40" rx="3" fill="none" stroke="#00ff60" stroke-width="1.5" filter="url(#glow)"/>
<rect x="154" y="18" width="28" height="40" rx="3" fill="#040008"/><rect x="154" y="18" width="28" height="40" rx="3" fill="none" stroke="#b000ff" stroke-width="1.5" filter="url(#glow)"/>
<circle cx="32" cy="38" r="5" fill="#00f0e0" opacity="0.7" filter="url(#glow)"/>
<circle cx="66" cy="38" r="5" fill="#ff0060" opacity="0.7" filter="url(#glow)"/>
<circle cx="100" cy="38" r="5" fill="#0080ff" opacity="0.7" filter="url(#glow)"/>
<circle cx="134" cy="38" r="5" fill="#00ff60" opacity="0.7" filter="url(#glow)"/>
<circle cx="168" cy="38" r="5" fill="#b000ff" opacity="0.7" filter="url(#glow)"/>
<text x="100" y="92" font-size="14" font-family="'Courier New',monospace" font-weight="bold" text-anchor="middle" fill="#b000ff" letter-spacing="3" filter="url(#glow)">NEON</text>
<text x="100" y="110" font-size="7.5" font-family="'Courier New',monospace" text-anchor="middle" fill="#6000c0" letter-spacing="1.5">SYNTHWAVE LANDS</text>
<!-- scan lines -->
<g opacity="0.07">${Array.from({ length: 17 }, (_, i) => `<line x1="0" y1="${i * 8}" x2="200" y2="${i * 8}" stroke="white" stroke-width="0.5"/>`).join('')}</g>
</svg>`);

// ═════════════════════════════════════════════════════════════════════════════
//  Done
// ═════════════════════════════════════════════════════════════════════════════
console.log('\nAll test packs written to client/public/cards/skins/');
console.log('Register them in server/src/db.ts BUILTIN_PACKS (already done).');
