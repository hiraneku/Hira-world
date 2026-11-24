// High-detail pixel art sprites inspired by WorldBox

const PALETTE: Record<string, string> = {
  '.': '',
  // Trunk & bark
  k: '#2b1a0e',
  t: '#4a2e16',
  T: '#704826',
  // Oak / lush green
  d: '#134e26',
  g: '#1d7535',
  G: '#38a148',
  l: '#76cc49',
  L: '#a7e359',
  // Pine
  p: '#064e3b',
  P: '#047857',
  m: '#10b981',
  // Palm
  a: '#3f6212',
  A: '#65a30d',
  y: '#a3e635',
  // Red Mushroom
  r: '#991b1b',
  R: '#dc2626',
  w: '#f8fafc',
  s: '#cbd5e1',
};

const OAK_SPRITE = [
  '....llGGd.....',
  '...lLLGGGGd...',
  '..lLGGGGGGGg..',
  '.lGGGGgGGGGgd.',
  '.gGGggdgGGggd.',
  '.dggd.ddgggdd.',
  '..dd..tTt.dd..',
  '......tTt.....',
  '.....ktTtk....',
  '.....ktttk....',
  '....dktttkd...',
];

const PINE_SPRITE = [
  '.....mm.....',
  '....mPPp....',
  '...mPPPPp...',
  '....PppP....',
  '...mPPPPp...',
  '..mPPPPPPp..',
  '...pPppPp...',
  '....tTtk....',
  '....tTtk....',
  '...dkttkd...',
];

const PALM_SPRITE = [
  '..yy....yy..',
  '.yAAy..yAAy.',
  'aAAaaAAaaAAa',
  '.a..aTTa..a.',
  '.....Tt.....',
  '.....Tt.....',
  '....dttd....',
  '....dttd....',
];

const MUSHROOM_SPRITE = [
  '..RRRR..',
  '.RwRRwR.',
  'RRRwRRRR',
  'rrrrrrrr',
  '..swws..',
  '..swws..',
  '.dswwsd.',
];

const BUSH_SPRITE = [
  '..llGd..',
  '.lGGGGd.',
  'gGGRGGgd',
  'dgggggdd',
  '.dddddd.',
];

function buildSpriteCanvas(rows: string[]): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const col = PALETTE[ch];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return c;
}

export const SPRITES = {
  oak: buildSpriteCanvas(OAK_SPRITE),
  pine: buildSpriteCanvas(PINE_SPRITE),
  palm: buildSpriteCanvas(PALM_SPRITE),
  mushroom: buildSpriteCanvas(MUSHROOM_SPRITE),
  bush: buildSpriteCanvas(BUSH_SPRITE),
};
