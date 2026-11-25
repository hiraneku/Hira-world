import type { ToolId } from './types';

// Crisp pixel-art sprites assembled from stepped clusters and a restrained palette.
// Canvas smoothing is disabled by Renderer so every source cell stays a hard pixel.

const C = {
  barkShadow: '#463126',
  bark: '#765033',
  barkLight: '#a06c3c',
  leafShadow: '#315f36',
  leafMid: '#3e7b3d',
  leaf: '#559747',
  leafLight: '#78b84d',
  leafSun: '#a2d45d',
  pineShadow: '#315e49',
  pine: '#378363',
  pineLight: '#55a574',
  pineSun: '#8fc96c',
  palmShadow: '#496d2c',
  palm: '#79a83c',
  palmLight: '#b5d458',
  flower: '#ed6e78',
  flowerLight: '#ffd56a',
  grassShadow: '#285c32',
  grass: '#538d3b',
  grassLight: '#8ac34c',
};

function makeCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create sprite canvas');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function pixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

// Row-stepped ellipse with subtle scallops, rather than a smooth vector circle.
function leafBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  seed = 0
): void {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const dy = (y - cy) / ry;
    const curve = Math.sqrt(Math.max(0, 1 - dy * dy));
    const notch = ((y + seed) % 4 === 0 || (y + seed) % 7 === 0) ? 1 : 0;
    const half = Math.max(0, Math.floor(rx * curve) - notch);
    const left = Math.ceil(cx - half);
    const right = Math.floor(cx + half);
    ctx.fillStyle = color;
    ctx.fillRect(left, y, right - left + 1, 1);
  }
}

function createOak(variant: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(24, 24);
  const offset = variant ? 1 : 0;

  // Broad, uneven canopy made from overlapping leaf masses and lit facets.
  leafBlob(ctx, 12, 8, 10, 7, C.leafShadow, variant);
  leafBlob(ctx, 7 + offset, 7, 5.4, 4.6, C.leafMid, variant + 2);
  leafBlob(ctx, 14, 6.5 + offset, 5.8, 4.8, C.leaf, variant + 3);
  leafBlob(ctx, 18 - offset, 8.7, 4.5, 4.2, C.leafMid, variant + 1);
  leafBlob(ctx, 11, 10, 7.2, 3.6, C.leaf, variant + 4);

  // Chunked highlights sit on the upper-left sides of the canopy clusters.
  leafBlob(ctx, 6, 5.5 + offset, 2.3, 1.7, C.leafLight, 1 + variant);
  leafBlob(ctx, 12, 4.6, 2.8, 1.8, C.leafSun, 2 + variant);
  leafBlob(ctx, 17, 7 + offset, 2.3, 1.7, C.leafLight, 3 + variant);
  leafBlob(ctx, 10, 8, 2.2, 1.4, C.leafLight, 4 + variant);
  pixel(ctx, 5 + offset, 8, C.leafSun);
  pixel(ctx, 15 - offset, 10, C.leafLight);
  pixel(ctx, 19, 9, C.leafSun);

  // Trunk, short branches and roots are drawn over the canopy for clear depth.
  ctx.fillStyle = C.barkShadow;
  ctx.fillRect(10, 11, 4, 12);
  ctx.fillStyle = C.bark;
  ctx.fillRect(11, 11, 2, 12);
  ctx.fillStyle = C.barkLight;
  ctx.fillRect(11, 13, 1, 7);
  pixel(ctx, 12, 15, C.barkLight);
  ctx.fillStyle = C.barkShadow;
  ctx.fillRect(7, 10, 4, 2);
  ctx.fillRect(13, 10, 4, 2);
  pixel(ctx, 8, 9, C.bark);
  pixel(ctx, 15, 9, C.bark);
  ctx.fillRect(8, 22, 4, 1);
  ctx.fillRect(12, 22, 4, 1);

  return canvas;
}

function createPine(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(24, 25);
  const center = 12;

  // Tiered boughs have irregular stepped edges and overlapping green facets.
  for (let y = 1; y <= 20; y++) {
    const tier = y < 6 ? 0 : y < 11 ? 1 : y < 16 ? 2 : 3;
    const widths = [3, 6, 8, 10];
    const progress = tier === 0 ? y / 5 : tier === 1 ? (y - 5) / 6 : tier === 2 ? (y - 10) / 6 : (y - 15) / 5;
    const half = Math.min(widths[tier], Math.floor(widths[tier] * (0.56 + progress * 0.48)));
    const indent = y % 5 === 0 ? 1 : 0;
    const left = center - half + indent;
    const right = center + half - indent;
    ctx.fillStyle = y < 6 ? C.pineShadow : y % 4 === 0 ? C.pineShadow : C.pine;
    ctx.fillRect(left, y, right - left + 1, 1);

    // Needle highlights are small broken dashes, not a continuous outline.
    if (y > 2 && y % 3 === 0) {
      pixel(ctx, left + 1, y, C.pineLight);
      pixel(ctx, Math.min(right - 1, center + Math.floor(half * 0.35)), y, C.pineSun);
    }
    if (y % 4 === 1 && half > 4) pixel(ctx, center - Math.floor(half * 0.45), y, C.pineLight);
  }

  // A few shaded bough tips break the perfect triangle into a natural silhouette.
  for (const [x, y] of [[4, 8], [6, 13], [19, 10], [17, 17], [9, 19]]) {
    pixel(ctx, x, y, C.pineShadow);
  }
  ctx.fillStyle = C.barkShadow;
  ctx.fillRect(10, 19, 4, 5);
  ctx.fillStyle = C.bark;
  ctx.fillRect(11, 19, 2, 5);
  pixel(ctx, 11, 21, C.barkLight);
  ctx.fillRect(9, 23, 3, 1);
  ctx.fillRect(13, 23, 3, 1);
  return canvas;
}

function drawPixelLine(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  offsetX = 0,
  offsetY = 0
): void {
  for (let i = 0; i < points.length - 1; i++) {
    let [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;
    while (true) {
      pixel(ctx, x0 + offsetX, y0 + offsetY, color);
      if (x0 === x1 && y0 === y1) break;
      const twice = 2 * error;
      if (twice > -dy) { error -= dy; x0 += sx; }
      if (twice < dx) { error += dx; y0 += sy; }
    }
  }
}

function createPalm(): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(25, 25);
  const crown: [number, number] = [12, 7];
  const fronds: [number, number][][] = [
    [crown, [10, 5], [7, 3], [4, 2], [1, 2]],
    [crown, [11, 4], [10, 2], [8, 1], [6, 1]],
    [crown, [14, 5], [17, 3], [20, 2], [23, 2]],
    [crown, [15, 6], [18, 5], [21, 5], [23, 6]],
    [crown, [14, 9], [17, 10], [20, 12], [22, 14]],
    [crown, [10, 8], [7, 9], [4, 11], [2, 13]],
  ];
  for (const frond of fronds) {
    drawPixelLine(ctx, frond, C.palmShadow);
    drawPixelLine(ctx, frond.slice(1), C.palm, 0, -1);
  }

  // Coconuts and a curved, banded trunk.
  pixel(ctx, 11, 7, C.barkShadow);
  pixel(ctx, 12, 7, C.bark);
  pixel(ctx, 13, 7, C.barkShadow);
  const trunk = [[12, 8], [12, 12], [13, 16], [13, 21], [12, 23]] as [number, number][];
  drawPixelLine(ctx, trunk, C.barkShadow, -1, 0);
  drawPixelLine(ctx, trunk, C.bark, 0, 0);
  drawPixelLine(ctx, trunk.slice(1), C.barkLight, 1, 0);
  pixel(ctx, 9, 23, C.barkShadow);
  pixel(ctx, 15, 23, C.barkShadow);
  return canvas;
}

function buildSpriteCanvas(rows: string[], palette: Record<string, string>): HTMLCanvasElement {
  const width = Math.max(...rows.map((row) => row.length));
  const { canvas, ctx } = makeCanvas(width, rows.length);
  for (let y = 0; y < rows.length; y++) {
    const offsetX = Math.floor((width - rows[y].length) * 0.5);
    for (let x = 0; x < rows[y].length; x++) {
      const color = palette[rows[y][x]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + offsetX, y, 1, 1);
      }
    }
  }
  return canvas;
}

const PLANT_PALETTE: Record<string, string> = {
  '.': '', q: C.grassShadow, Q: C.grass, L: C.grassLight,
  r: C.flower, w: C.flowerLight, d: C.leafShadow, g: C.leaf,
  G: C.leafLight, l: C.leafSun,
};

const BUSH = [
  '...ddGGg...',
  '.ddGGGGGGd.',
  'dGGGllGGGGd',
  'dGGGGGGGGGGd',
  '.dggGGGggd.',
  '..ddddddd..',
];
const GRASS_TUFT = [
  '...l...', '..lG...', '.qGg.l.', '.qGGgG.', '..qGGg.', '..qGq..', '.qqq...',
];
const FLOWER = [
  '..r...w..', '.rrr.www.', '..r...w..', '...q.q...', '..qQqQq..', '...qQq...', '....q....',
];

export const SPRITES = {
  oak: createOak(0),
  oakAlt: createOak(1),
  pine: createPine(),
  palm: createPalm(),
  bush: buildSpriteCanvas(BUSH, PLANT_PALETTE),
  grassTuft: buildSpriteCanvas(GRASS_TUFT, PLANT_PALETTE),
  flower: buildSpriteCanvas(FLOWER, PLANT_PALETTE),
};

const ICON_PALETTE: Record<string, string> = {
  '.': '',
  b: '#205d9e', B: '#3c91db', c: '#8de0f5',
  s: '#f1d58b', S: '#d6b76a', t: '#925d37', T: '#bd8050',
  g: '#34783b', G: '#58a945', L: '#a6d854',
  r: '#6b747d', R: '#9aa4ac', w: '#eef5f7',
  p: '#287154', P: '#4c9b56', y: '#f5d45f',
  o: '#603a27', O: '#a65b32', f: '#ef6a28', F: '#ffd84d',
  d: '#3c4550', D: '#222a34', m: '#a66d43', M: '#d1a16b',
};

const TOOL_ICON_ROWS: Record<ToolId, string[]> = {
  deep_water: ['..bbbbbb..', '.bBBBBBBb.', 'bbbbbbbbbb', '..cc..bbbb', '.bBBBBb...', 'bbbbbbbb..', '..bb..bbbb', '.bBBBBBBb.'],
  shallow_water: ['..cccccc..', '.cBBBBBBc.', 'cccccccccc', '..BB..cccc', '.cBBBBc...', 'cccccccc..', '..cc..cccc', '.cBBBBBBc.'],
  sand: ['..ssssss..', '.sSSSSSSs.', 'ssssssssss', 'sS..s.SS.s', 'ssS...Ssss', 'ssssssssss', '..sSSSSs..'],
  soil: ['..tttttt..', '.tTTTTTTt.', 'ttTttTtttt', 'tTttTttTtt', 'ttTttttTtt', 'tTttTttTtt', '.ttTTTTtt.'],
  grass: ['...GGGG...', '..GLLLLG..', '.GGGGGGGG.', 'GGGgGGGGGG', 'GGGGGGgGGG', '.GGGGGGGG.', '..GGGGGG..', '...gggg...'],
  hill: ['.....r.....', '....rRr....', '...rRRRr...', '..rRrRRRr..', '.rRRrRRRRr.', 'rRRRRRRRRRr', 'rrrrrrrrrrr'],
  mountain: ['......w......', '.....www.....', '....wRwRw....', '...rRRRRRr...', '..rRRwRRRRr..', '.rRRRRRRRRRr.', 'rrrrrrrrrrrrr'],
  snow: ['.....w.....', '...w.w.w...', '....www....', '.wwwwwwwww.', '....www....', '...w.w.w...', '.....w.....'],
  forest_trees: ['..gGGGg..', '.gGGGGGg.', 'gGGGLGGGGg', 'GGGGGGGGGG', '..ttt..', '..tTt..', '..tTt..', '.dtttd.'],
  rain: ['...rrrrr...', '.rrrrrrrrr.', 'rrrrrrrrrrr', '.rrrrrrrrr.', '..cc...cc..', '.c..c.c..c.', '....c......'],
  fire: ['.....f.....', '....fFf....', '...fFFFf...', '..fFFfFFf..', '.ffFfFFFff.', '..fffFfff..', '...fffff...'],
  lava: ['....rrr....', '...rRRRr...', '..rRRRRRr..', '.rRRrRRRRr.', 'rrrrrrrrrrr', '..oo..oo...', '.OOOOOOOOO.'],
  bomb: ['....DD....', '..DDDDDD..', '.DDDDDDDD.', '.DDDDDDDD.', '..DDDDDD..', '....DD....', '....tt....', '...tFFt...'],
  meteor: ['......f....', '.....fFf...', '...mmFf....', '..mMMm.....', '.mMMmm......', 'mMMMMm......', '.mmmm.......'],
};

export const TOOL_ICONS = Object.fromEntries(
  Object.entries(TOOL_ICON_ROWS).map(([id, rows]) => [id, buildSpriteCanvas(rows, ICON_PALETTE)])
) as Record<ToolId, HTMLCanvasElement>;
