import type { ToolId } from './types';

// Hand-authored pixel maps. Each character is one palette pixel; rows are
// centered into a small transparent canvas and rendered with nearest-neighbour.
const TREE_PALETTE: Record<string, string> = {
  '.': '',
  d: '#285333', g: '#3b7139', G: '#559342', L: '#7eb94b', Y: '#afd15b',
  p: '#315c48', P: '#367b5d', Q: '#4c9a6d', H: '#83bd6a',
  a: '#73502f', b: '#4a3327', t: '#875a36', T: '#ad7847',
  o: '#75472c', O: '#a96332', R: '#c47c37', S: '#dfaa4c',
  x: '#3e4142', X: '#595b59', h: '#77766c',
  f: '#e27e9b',
};

const PLANT_PALETTE: Record<string, string> = {
  '.': '', q: '#285c32', Q: '#538d3b', L: '#8ac34c',
  r: '#ed6e78', w: '#ffd56a', d: '#315f36', g: '#559747',
  G: '#78b84d', l: '#a2d45d',
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

function buildSpriteCanvas(rows: string[], palette: Record<string, string>): HTMLCanvasElement {
  const width = Math.max(...rows.map((row) => row.length));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create sprite canvas');
  ctx.imageSmoothingEnabled = false;

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

// Broadleaf canopy: stepped lobes, deep underside, separated highlights and a
// thin forked trunk. These are deliberately pixel-clustered, not vector blobs.
const OAK = [
  '........ddGGGdd........',
  '......ddGGGGGGGGd......',
  '....ddGGGGGGGGGGGGd....',
  '...dGGGLLGGGGGGGGGGGd...',
  '..dGGGGGGGGGGGGGGGGGGd..',
  '.dGGGGGLLGGGGGGGGGGGGGGd.',
  'dGGGGGGGGGGGGGGGGGGGGGGGd',
  'dGGGggGGGGGGGGGGGGGLLGGGGd',
  'dGGGGGGGGGGGGGGGGGGGGGGGGd',
  '.dGGGGGGGGggGGGGGGGGGGGGd.',
  '..dGGGGGGGGGGGGGGGGGGGd..',
  '...ddGGGGGGGGGGGGGdd...',
  '.....dddddGGGddddd.....',
  '.........ddGdd.........',
  '..........ata..........',
  '..........ata..........',
  '.........bTTab.........',
  '.........bTtab.........',
  '........d.aTa.d........',
];

// A second crown has a lower, wider silhouette and differently placed leaf
// clusters, so the map is not made from repeated mirrored stamps.
const OAK_WIDE = [
  '......ddGGGGGGdd......',
  '....ddGGGGGGGGGGdd....',
  '..ddGGGGLLGGGGGGGGGd..',
  '.dGGGGGGGGGGGGGGGGGGd.',
  'dGGGLLGGGGGGGGGGGGGGGGd',
  'dGGGGGGGGGGGGGGGGGGGGGGd',
  'dGGGGGGggGGGGGGGLLGGGGGd',
  '.dGGGGGGGGGGGGGGGGGGGGd.',
  '..ddGGGGGGGGGGGGGGGdd..',
  '....ddddGGGGGGdddd....',
  '........ddGGdd........',
  '.........ata..........',
  '.........ata..........',
  '........bTTab.........',
  '........bTtab.........',
  '.......d.aTa.d........',
  '.......d..a..d........',
];

// Golden/burnt deciduous canopy to break up the all-green forest palette.
const AUTUMN_OAK = [
  '........ooRRRoo........',
  '......ooRRRRRRRr......',
  '....ooRRRRRRRRRRRr....',
  '...oRRRSSLRRRRRRRRr...',
  '..oRRRRRRRRRRRRRRRRRr..',
  '.oRRRRRSSRRRRRRRRRRRRRr.',
  'oRRRRRRRRRRRRRRRRRRRRRRRr',
  'oRRRoORRRRRRRRRRRRRRSSRRRr',
  'oRRRRRRRRRRRRRRRRRRRRRRRRr',
  '.oRRRRRRRRooRRRRRRRRRRRRr.',
  '..oRRRRRRRRRRRRRRRRRRRr..',
  '...ooRRRRRRRRRRRRRoo...',
  '.....oooooRRRooooo.....',
  '.........ooRoo.........',
  '..........ata..........',
  '..........ata..........',
  '.........bTTab.........',
  '.........bTtab.........',
  '........d.aTa.d........',
];

// Conifer boughs are grouped into irregular, layered shelves instead of one
// solid teal triangle. The quiet trunk is mostly hidden under the branches.
const PINE = [
  '..........pPp..........',
  '.........pPPQp.........',
  '........pPPPPQp........',
  '.......pPPHPPPPQp.......',
  '......pPPPPPPPPPPp......',
  '.....pPPQPPPPPPPPPPp.....',
  '....pPPPPPPPPPPPPPPQp....',
  '...pPPPPHPPPPPPPPPPPPp...',
  '..pPPPPPPPPPPPPPPPPPPPPp..',
  '..pPPPQPPPPPPPPPPPPPPPPp..',
  '...pPPPPPPPPHPPPPPPPPPp...',
  '....pPPPPPPPPPPPPPPPPp....',
  '.....pPPQPPPPPPPPPPp.....',
  '......pPPPPPPPPPPp......',
  '.......pPPPPPPp.......',
  '........pPPQp........',
  '.........pPp.........',
  '..........ata..........',
  '..........ata..........',
  '.........bTTab.........',
  '.........bTtab.........',
];

// Leafless branches for sparse clearings and dry ground.
const DEAD_TREE = [
  '...........x...........',
  '...........Xx..........',
  '.........xxXx...........',
  '.........x.x............',
  '.......xxX.x....xx......',
  '.......x...x...xXx......',
  '.....xxX...x..xx.x......',
  '.....x..x..x.x...x......',
  '...xxX..x..xXx...x......',
  '...x....x..x..x..x......',
  '..x.....x..x...x.x......',
  '..x.....x..x...x.x......',
  '........x..x....x.......',
  '........x..x............',
  '........x..x............',
  '........x..x............',
  '........x..x............',
  '........x..x............',
  '.......xx..xx...........',
];

// Palm fronds and curved trunk, used only around warm shoreline tiles.
const PALM = [
  '....LL..............LL....',
  '...LQQl............lQQL...',
  '..LQQQqL..........LqQQQL..',
  '.QQL..qQL........LQq..LQQ.',
  'qQ.....qQL......LQq.....Qq',
  '........qQL....LQq........',
  '..........qQLLQq..........',
  '...........qQq............',
  '............a.............',
  '............a.............',
  '............a.............',
  '............a.............',
  '...........ba.............',
  '...........ba.............',
  '..........dada............',
];

const BUSH = [
  '....ddGGg....',
  '..ddGGGGGGd..',
  '.dGGGllGGGGd.',
  'dGGGGGGGGGGGd',
  'dGggGGGgGGGgd',
  '.ddgggggggdd.',
  '...ddddddd...',
];
const GRASS_TUFT = [
  '...l....', '..lG....', '.qGg.l..', '.qGGgG..', '..qGGg..', '..qGq...', '.qqq....',
];
const FLOWER = [
  '..r...w..', '.rrr.www.', '..r...w..', '...q.q...', '..qQqQq..', '...qQq...', '....q....',
];

const ROCK = [
  '......dddd......',
  '....ddMMMMdd....',
  '..ddMMMMMMMMdd..',
  '.dMMMMMMmmMMMMd.',
  'dMMMMMmmMMMMMMMd',
  'dMMmMMMMMMMMMMMd',
  '.dMMMMMMMMMMMMd.',
  '..ddMMMMMMMMdd..',
  '....dddddddd....',
];
const ORE = [
  '......dddd......',
  '....ddMMMMdd....',
  '..ddMMMMMMMMdd..',
  '.dMMMMccMMMMMd.',
  'dMMMMcwwcMMMMMd',
  'dMMMccwwccMMMMd',
  '.dMMMMccMMMMMd.',
  '..ddMMMMMMMMdd..',
  '....dddddddd....',
];
const ROCK_PALETTE: Record<string, string> = {
  '.': '', d: '#3f454c', m: '#555d66', M: '#777f88',
  c: '#4e8791', w: '#dcecee',
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

export const SPRITES = {
  oak: buildSpriteCanvas(OAK, TREE_PALETTE),
  oakAlt: buildSpriteCanvas(OAK_WIDE, TREE_PALETTE),
  autumn: buildSpriteCanvas(AUTUMN_OAK, TREE_PALETTE),
  pine: buildSpriteCanvas(PINE, TREE_PALETTE),
  deadTree: buildSpriteCanvas(DEAD_TREE, TREE_PALETTE),
  palm: buildSpriteCanvas(PALM, TREE_PALETTE),
  bush: buildSpriteCanvas(BUSH, PLANT_PALETTE),
  grassTuft: buildSpriteCanvas(GRASS_TUFT, PLANT_PALETTE),
  flower: buildSpriteCanvas(FLOWER, PLANT_PALETTE),
  rock: buildSpriteCanvas(ROCK, ROCK_PALETTE),
  ore: buildSpriteCanvas(ORE, ROCK_PALETTE),
};

export const TOOL_ICONS = Object.fromEntries(
  Object.entries(TOOL_ICON_ROWS).map(([id, rows]) => [id, buildSpriteCanvas(rows, ICON_PALETTE)])
) as Record<ToolId, HTMLCanvasElement>;
