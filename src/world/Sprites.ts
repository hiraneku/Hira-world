// Hand-authored, transparent pixel sprites for trees and small vegetation.
// Every character is one crisp pixel; the renderer scales with smoothing off.

const PALETTE: Record<string, string> = {
  '.': '',
  // Trunk: deep outline, bark midtones, and sunlit edges.
  k: '#34251d',
  t: '#59402c',
  T: '#805735',
  b: '#a37442',
  // Broadleaf canopy, from deep occlusion to small sunlit leaf clusters.
  d: '#173d23',
  g: '#28733a',
  G: '#439947',
  l: '#78c64a',
  L: '#a5df59',
  H: '#c5eb70',
  f: '#ec4899',
  r: '#e84d5b',
  // Pine needles.
  p: '#123d38',
  P: '#08715a',
  m: '#20a36d',
  n: '#73c85b',
  // Palm leaves.
  a: '#456b25',
  A: '#75a832',
  y: '#b8d84c',
  // Ground plants.
  q: '#20562e',
  Q: '#458b35',
  w: '#f3dc74',
};

const OAK_SPRITE = [
  '.....ddGGGGGGGGGdd.....',
  '...ddGGGGGGGGGGGGGdd...',
  '..dGGGGllGGGGGGGGGGGd..',
  '.dGGGGGGGGGGGGGLLGGGGGd.',
  'dGGGllGGGGGGGGGGGGGGGGGd',
  'dGGGGGGGGGGGGGGGGGGGGGGd',
  'dGGGGGGGgGGGGGGGGllGGGGd',
  '.ddGGGggddGGGGGggGGGdd.',
  '...ddddd..ddgggddddd...',
  '.........ddggdd.........',
  '..........tttTt..........',
  '...........tTTt...........',
  '...........tTTt...........',
  '..........ktTTtk..........',
  '..........ktTttk..........',
  '.........dtTttTtd.........',
  '........dd.ttt.dd........',
];

const PINE_SPRITE = [
  '..........mPp..........',
  '.........mPPPPp.........',
  '........mPPPPPPp........',
  '.......mPPPPPPPPp.......',
  '......mPPPPnPPPPPp......',
  '.....mPPPPPPPPPPPPp.....',
  '....mPPPPPPPPPPPPPPp....',
  '...mPPPPnPPPPPPPPPPPp...',
  '..mPPPPPPPPPPPPPPPPPPPp..',
  '.mPPPPPPPPPPPPPPPPPPPPPPp.',
  '..pPPPPPPnPPPPPPPPPPPPPPp..',
  '...pPPPPPPPPPPPPPPPPPPp...',
  '....pPPPPPPPPPPPPPPPp....',
  '.....pPPPPPPPPPPp.....',
  '......pPPPPPPp......',
  '.......ptTt.......',
  '.......ptTt.......',
  '.......ktTtk......',
  '......dtTttTd.....',
];

const PALM_SPRITE = [
  '....yy............yy....',
  '...yAAy..........yAAy...',
  '..yAAAy.........yAAAy..',
  '.aAAaaAyy....yyAAaaAAa.',
  '..a....AAy..yAA....a..',
  '........aAAyAa........',
  '..........aA..........',
  '..........tT..........',
  '..........tT..........',
  '..........tT..........',
  '.........dtTtd........',
  '.........dtTtd........',
];

const BUSH_SPRITE = [
  '....ddGGg....',
  '..ddGGGGGGd..',
  '.dGGGllGGGGd.',
  'dGGGGGGGGGGGd',
  'dGggGGGgGGGgd',
  '.ddgggggggdd.',
  '...ddddddd...',
];

const GRASS_TUFT_SPRITE = [
  '...l....',
  '..lG....',
  '.qGg.l..',
  '.qGGgG..',
  '..qGGg..',
  '..qGq...',
  '.qqq....',
];

const FLOWER_SPRITE = [
  '..r...f..',
  '.rrr.fff.',
  '..r...f..',
  '...q.q...',
  '..qQqQq..',
  '...qQq...',
  '....q....',
];

function buildSpriteCanvas(rows: string[]): HTMLCanvasElement {
  const h = rows.length;
  const w = Math.max(...rows.map((row) => row.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    const offsetX = Math.floor((w - rows[y].length) * 0.5);
    for (let x = 0; x < rows[y].length; x++) {
      const col = PALETTE[rows[y][x]];
      if (col) {
        ctx.fillStyle = col;
        ctx.fillRect(x + offsetX, y, 1, 1);
      }
    }
  }
  return c;
}

export const SPRITES = {
  oak: buildSpriteCanvas(OAK_SPRITE),
  pine: buildSpriteCanvas(PINE_SPRITE),
  palm: buildSpriteCanvas(PALM_SPRITE),
  bush: buildSpriteCanvas(BUSH_SPRITE),
  grassTuft: buildSpriteCanvas(GRASS_TUFT_SPRITE),
  flower: buildSpriteCanvas(FLOWER_SPRITE),
};
