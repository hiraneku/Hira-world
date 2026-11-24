// Pre-rendered high-detail pixel art sprites (cached on offscreen canvases for 60 FPS)

const PALETTE: Record<string, string> = {
  '.': '',
  // Trunk
  t: '#4a2e16',
  T: '#6b4423',
  // Oak / Green leaves
  d: '#14532d',
  g: '#1f7a38',
  G: '#38a148',
  l: '#74c947',
  // Pine
  p: '#064e3b',
  P: '#047857',
  m: '#10b981',
  // Palm
  a: '#3f6212',
  A: '#65a30d',
  y: '#a3e635',
};

const OAK_SPRITE = [
  '....lGG.....',
  '...lGGGGd...',
  '..lGGGGGGd..',
  '.lGGGgGGGgd.',
  '.gGGgdgGGgd.',
  '.dggd.dggdd.',
  '..dd..Ttd...',
  '......Tt....',
  '......Tt....',
  '.....dttd...',
];

const PINE_SPRITE = [
  '.....mm.....',
  '....mPPm....',
  '...mPPPPp...',
  '....PppP....',
  '...mPPPPp...',
  '..mPPPPPPp..',
  '...pPppPp...',
  '.....Tt.....',
  '.....Tt.....',
  '....dttd....',
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
};
