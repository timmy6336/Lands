/**
 * Generates SVG placeholder card art for each land type.
 * Run: node generate-cards.mjs
 *
 * To use your own art: replace the files in client/public/cards/
 * with any image format (PNG, JPG, SVG, etc.) and update the
 * image extension in client/src/components/Card.tsx accordingly.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'client', 'public', 'cards');
mkdirSync(outDir, { recursive: true });

const W = 200, H = 280;

const cards = [
  {
    name: 'white',
    bg: '#d6ceb0', shine: '#f0e8cc', dark: '#a89060',
    text: '#5a4020', label: 'WHITE', initial: 'W',
  },
  {
    name: 'red',
    bg: '#8b1a1a', shine: '#c0392b', dark: '#5a0000',
    text: '#ffccaa', label: 'RED', initial: 'R',
  },
  {
    name: 'blue',
    bg: '#0e3d6b', shine: '#1a6fa8', dark: '#071e3a',
    text: '#99ddff', label: 'BLUE', initial: 'B',
  },
  {
    name: 'green',
    bg: '#1a4d2e', shine: '#2d7a47', dark: '#0a2414',
    text: '#aaeecc', label: 'GREEN', initial: 'G',
  },
  {
    name: 'black',
    bg: '#0d0d0d', shine: '#2a2a2a', dark: '#000000',
    text: '#887799', label: 'BLACK', initial: 'K',
  },
];

for (const card of cards) {
  const textureLines = Array.from({ length: 12 }, (_, i) => {
    const y = 20 + i * 22;
    return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${card.text}" stroke-width="0.4" stroke-opacity="0.12"/>`;
  }).join('\n  ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${card.shine}"/>
      <stop offset="50%" stop-color="${card.bg}"/>
      <stop offset="100%" stop-color="${card.dark}"/>
    </linearGradient>
    <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" rx="6"/>
  ${textureLines}
  <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${card.text}" stroke-width="1.5" stroke-opacity="0.4" rx="4"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)" rx="6"/>
  <text x="${W / 2}" y="${H / 2 - 10}" font-size="110" font-family="Georgia, serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.14" fill="${card.text}">${card.initial}</text>
  <rect x="8" y="8" width="${W - 16}" height="28" fill="${card.text}" fill-opacity="0.12" rx="3"/>
  <text x="${W / 2}" y="27" font-size="11" font-family="Georgia, serif" font-weight="bold" text-anchor="middle" fill="${card.text}" letter-spacing="3">${card.label}</text>
  <circle cx="20" cy="20" r="5" fill="${card.text}" fill-opacity="0.25"/>
  <circle cx="${W - 20}" cy="20" r="5" fill="${card.text}" fill-opacity="0.25"/>
  <circle cx="20" cy="${H - 20}" r="5" fill="${card.text}" fill-opacity="0.25"/>
  <circle cx="${W - 20}" cy="${H - 20}" r="5" fill="${card.text}" fill-opacity="0.25"/>
</svg>`;

  const outPath = join(outDir, `${card.name}.svg`);
  writeFileSync(outPath, svg, 'utf8');
  console.log(`Created: ${outPath}`);
}

console.log('\nDone! SVG card art is in client/public/cards/');
console.log('Replace any file with your own PNG/JPG/SVG art.');
console.log('If using a different extension, update the src in client/src/components/Card.tsx');
