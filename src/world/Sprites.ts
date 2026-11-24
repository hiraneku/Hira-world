// High-detail 16x18 pixel art sprites matching WorldBox zoom-in detail

const PALETTE: Record<string, string> = {
  '.': '',
  // Trunk & bark: a dark outline, warm midtone, and sunlit bark pixels.
  k: '#34251d',
  t: '#59402c',
  T: '#805735',
  b: '#a37442',
  // Oak canopy: four related greens create readable clumps and highlights.
  d: '#174524',
  g: '#287a36',
  G: '#449d3e',
  l: '#78c64a',
  L: '#a5df59',
  // Fruit / blossom accents
  f: '#ec4899',
  r: '#ef4444',
  // Pine
  p: '#064e3b',
  P: '#047857',
  m: '#10b981',
  // Palm
  a: '#3f6212',
  A: '#65a30d',
  y: '#a3e635',
  // Red Mushroom
  R: '#dc2626',
  w: '#f8fafc',
  s: '#cbd5e1',
  // Rock / Ore
  o: '#334155',
  O: '#64748b',
  c: '#94a3b8',
  i: '#38bdf8',
};

const OAK_SPRITE = [
  '.....llGGd......',
  '...llGGGGGGd....',
  '..lLLGGGGGGGg...',
  '.lLGGGfGGGGGGd..',
  '.lGGGgGGGGgGGd..',
  '.gGGggdGGggGGd..',
  '..dggd.ddgggdd..',
  '...dd..tTb.dd...',
  '.......tTb......',
  '......ktTbk.....',
  '......ktttk.....',
  '.....dtTttbd....',
  '....dk.tt..kd...',
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
  'gGGrGGgd',
  'dgggggdd',
  '.dddddd.',
];

const ROCK_SPRITE = [
  '..cOOo..',
  '.cOOOOo.',
  'cOOiOOOo',
  'oOOOOooo',
  '.oooooo.',
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
  rock: buildSpriteCanvas(ROCK_SPRITE),
};
