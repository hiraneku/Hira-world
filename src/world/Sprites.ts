// Hand-authored, transparent pixel sprites for the world vegetation.
// Each character is one crisp palette pixel, with no anti-aliased outlines.

const PALETTE: Record<string, string> = {
  '.': '',
  // Warm bark with a shaded edge and small sunlit pixels.
  k: '#463126',
  t: '#65452f',
  T: '#8c613a',
  b: '#b17a45',
  // Soft, layered deciduous foliage; avoid hard black outlines between trees.
  d: '#3d7040',
  g: '#468440',
  G: '#579a45',
  l: '#77b94c',
  L: '#9fd35a',
  H: '#b8e16c',
  f: '#e983a9',
  r: '#e85c58',
  // Pine needles in cool, natural greens.
  p: '#356b50',
  P: '#37845d',
  m: '#4da673',
  n: '#8bc969',
  // Palm leaves.
  a: '#4d702c',
  A: '#78a93b',
  y: '#bad857',
  // Ground plants.
  q: '#285c32',
  Q: '#538d3b',
  w: '#f3dc74',
};

const OAK_SPRITE = [
  '....ddGGGGGdd....',
  '..dGGGGGGGGGGGd..',
  '.dGGGllGGGGGGGGGd.',
  'dGGGGGGGGGGGGGGGGd',
  'GGGGGGGGGGGGGGGGGG',
  'GGGGllGGGGGGLLGGGG',
  'dGGGGGGgGGGGGGGGGd',
  '.dGGGggGGGGggGGGd.',
  '..dddddGGGGGddddd..',
  '.....ddGGGdd.....',
  '.......tttTt.......',
  '........tTTt........',
  '........tTTt........',
  '.......ktTTtk.......',
  '.......ktTttk.......',
  '......dtTttTtd......',
  '......dd.ttt.dd.....',
];

const OAK_ALT_SPRITE = [
  '.....ddGGGGdd.....',
  '...dGGGGGGGGGGd...',
  '..dGGllGGGGGGGGGd..',
  '.dGGGGGGGGGGGGGGGd.',
  'dGGGGGGGGGGGGGGGGGGd',
  'dGGGGGGGgGGGGGGGLLGd',
  'dGGGGGggGGGGGGGGGGGd',
  '.dGGGggGGGGGgGGGGGd.',
  '..dddddGGGGGGddddd..',
  '.......ddGGdd.......',
  '........ttTt........',
  '........tTTt........',
  '........ktTtk.......',
  '........ktTtk.......',
  '.......dtTttTd......',
  '.......dd.ttt.dd.....',
];

const PINE_SPRITE = [
  '.........mPp.........',
  '........mPPPPp........',
  '.......mPPPPPPp.......',
  '......mPPnPPPPPp......',
  '.....mPPPPPPPPPPp.....',
  '....mPPPPPPPPPPPPp....',
  '...mPPnPPPPPPPPPPPp...',
  '..mPPPPPPPPPPPPPPPPp..',
  '.pPPPPPPPPPPPPPPPPPPp.',
  '..pPPPPnPPPPPPPPPPPp..',
  '...pPPPPPPPPPPPPPp...',
  '....pPPPPPPPPPPp....',
  '.....pPPPPPPp.....',
  '......pPPPp......',
  '.......ptTt.......',
  '.......ptTt.......',
  '.......ktTtk......',
  '......dtTttTd.....',
];

const PALM_SPRITE = [
  '...yy..........yy...',
  '..yAAy........yAAy..',
  '.yAAAy........yAAAy.',
  'aAAaaAyy....yyAAaaAAa',
  '.a....AAy..yAA....a.',
  '.......aAAyAa.......',
  '.........aA.........',
  '.........tT.........',
  '.........tT.........',
  '........dtTtd.......',
  '........dtTtd.......',
];

const BUSH_SPRITE = [
  '...ddGGg...',
  '.ddGGGGGGd.',
  'dGGGllGGGGd',
  'dGGGGGGGGGGd',
  '.dggGGGggd.',
  '..ddddddd..',
];

const GRASS_TUFT_SPRITE = [
  '...l...',
  '..lG...',
  '.qGg.l.',
  '.qGGgG.',
  '..qGGg.',
  '..qGq..',
  '.qqq...',
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
  const width = Math.max(...rows.map((row) => row.length));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < rows.length; y++) {
    const offsetX = Math.floor((width - rows[y].length) / 2);
    for (let x = 0; x < rows[y].length; x++) {
      const color = PALETTE[rows[y][x]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + offsetX, y, 1, 1);
      }
    }
  }
  return canvas;
}

export const SPRITES = {
  oak: buildSpriteCanvas(OAK_SPRITE),
  oakAlt: buildSpriteCanvas(OAK_ALT_SPRITE),
  pine: buildSpriteCanvas(PINE_SPRITE),
  palm: buildSpriteCanvas(PALM_SPRITE),
  bush: buildSpriteCanvas(BUSH_SPRITE),
  grassTuft: buildSpriteCanvas(GRASS_TUFT_SPRITE),
  flower: buildSpriteCanvas(FLOWER_SPRITE),
};
