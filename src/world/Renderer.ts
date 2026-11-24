import { TileType } from './types';
import { World } from './World';

const TILE_COLORS: Record<TileType, [number, number, number][]> = {
  [TileType.DEEP_WATER]: [
    [22, 62, 122],
    [20, 58, 115],
    [25, 67, 130],
    [18, 54, 108],
  ],
  [TileType.SHALLOW_WATER]: [
    [45, 128, 196],
    [50, 135, 204],
    [42, 120, 188],
    [54, 140, 210],
  ],
  [TileType.SAND]: [
    [235, 212, 148],
    [228, 204, 138],
    [240, 218, 156],
    [222, 198, 132],
  ],
  [TileType.SOIL]: [
    [136, 98, 62],
    [128, 92, 58],
    [142, 104, 68],
    [122, 86, 54],
  ],
  [TileType.GRASS]: [
    [82, 168, 72],
    [76, 158, 66],
    [90, 176, 78],
    [72, 150, 62],
  ],
  [TileType.FOREST]: [
    [60, 132, 54],
    [55, 124, 50],
    [66, 140, 60],
    [52, 118, 48],
  ],
  [TileType.HILL]: [
    [118, 124, 132],
    [110, 116, 124],
    [126, 132, 140],
    [104, 110, 118],
  ],
  [TileType.MOUNTAIN]: [
    [84, 88, 96],
    [78, 82, 90],
    [92, 96, 104],
    [72, 76, 84],
  ],
  [TileType.SNOW]: [
    [236, 244, 252],
    [228, 238, 248],
    [242, 248, 255],
    [220, 232, 244],
  ],
  [TileType.LAVA]: [
    [238, 82, 22],
    [248, 118, 28],
    [220, 60, 18],
    [252, 152, 36],
  ],
  [TileType.ASH]: [
    [68, 66, 70],
    [62, 60, 64],
    [76, 74, 78],
    [56, 54, 58],
  ],
};

export interface Camera {
  x: number; // world center x in tile units
  y: number; // world center y in tile units
  zoom: number; // pixels per tile
}

export class Renderer {
  private terrainCanvas: HTMLCanvasElement;
  private terrainCtx: CanvasRenderingContext2D;
  private terrainImageData: ImageData;

  constructor(world: World) {
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = world.width;
    this.terrainCanvas.height = world.height;
    const ctx = this.terrainCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create offscreen 2D context');
    this.terrainCtx = ctx;
    this.terrainImageData = ctx.createImageData(world.width, world.height);
  }

  private updateTerrainTexture(world: World): void {
    const data = this.terrainImageData.data;
    const len = world.width * world.height;

    for (let i = 0; i < len; i++) {
      const tile = world.tiles[i] as TileType;
      const variant = world.tileVariant[i];
      const rgb = TILE_COLORS[tile][variant];
      const p = i * 4;
      data[p] = rgb[0];
      data[p + 1] = rgb[1];
      data[p + 2] = rgb[2];
      data[p + 3] = 255;
    }

    this.terrainCtx.putImageData(this.terrainImageData, 0, 0);
    world.terrainDirty = false;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    world: World,
    camera: Camera,
    timeSec: number,
    hoverTile: { x: number; y: number } | null,
    brushRadius: number
  ): void {
    if (world.terrainDirty) {
      this.updateTerrainTexture(world);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#0b1320';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const tileSize = camera.zoom;
    const offsetX = Math.floor(canvasWidth * 0.5 - camera.x * tileSize);
    const offsetY = Math.floor(canvasHeight * 0.5 - camera.y * tileSize);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 1. Draw Terrain
    ctx.drawImage(
      this.terrainCanvas,
      0,
      0,
      world.width * tileSize,
      world.height * tileSize
    );

    // Visible tile bounds for culling
    const startX = Math.max(0, Math.floor(-offsetX / tileSize) - 1);
    const endX = Math.min(
      world.width - 1,
      Math.ceil((canvasWidth - offsetX) / tileSize) + 1
    );
    const startY = Math.max(0, Math.floor(-offsetY / tileSize) - 1);
    const endY = Math.min(
      world.height - 1,
      Math.ceil((canvasHeight - offsetY) / tileSize) + 1
    );

    // 2. Animated Water Shimmer & Trees & Fire
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const idx = y * world.width + x;
        const tile = world.tiles[idx];
        const px = x * tileSize;
        const py = y * tileSize;

        if (tile === TileType.SHALLOW_WATER || tile === TileType.DEEP_WATER) {
          const wave = Math.sin(timeSec * 2.5 + x * 0.6 + y * 0.4);
          if (wave > 0.85) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.fillRect(px + tileSize * 0.2, py + tileSize * 0.35, tileSize * 0.5, Math.max(1, tileSize * 0.15));
          }
        }

        const tree = world.trees[idx];
        if (tree !== 0 && tileSize >= 3) {
          this.drawPixelTree(ctx, px, py, tileSize, tree, timeSec + x * 0.3);
        }

        const fire = world.fire[idx];
        if (fire > 0) {
          const flicker = Math.sin(timeSec * 18 + x * 3 + y * 7) * 0.5 + 0.5;
          ctx.fillStyle = flicker > 0.5 ? '#f97316' : '#facc15';
          ctx.fillRect(
            px + tileSize * 0.15,
            py + tileSize * (0.15 + flicker * 0.15),
            tileSize * 0.7,
            tileSize * 0.7
          );
        }
      }
    }

    // 3. Particles
    for (const p of world.particles) {
      ctx.fillStyle = p.color;
      const s = Math.max(2, (p.size * tileSize) / 8);
      ctx.fillRect(p.x * tileSize - s * 0.5, p.y * tileSize - s * 0.5, s, s);
    }

    // 4. Brush Cursor Preview
    if (hoverTile && world.inBounds(hoverTile.x, hoverTile.y)) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        (hoverTile.x + 0.5) * tileSize,
        (hoverTile.y + 0.5) * tileSize,
        Math.max(0.5, brushRadius) * tileSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawPixelTree(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    s: number,
    type: number,
    phase: number
  ): void {
    const sway = Math.sin(phase * 1.8) * s * 0.04;
    // Trunk
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(px + s * 0.4, py + s * 0.45, Math.max(1, s * 0.2), s * 0.45);

    if (type === 1) {
      // Oak
      ctx.fillStyle = '#1f6f2e';
      ctx.fillRect(px + s * 0.15 + sway, py + s * 0.1, s * 0.7, s * 0.5);
      ctx.fillStyle = '#2ea043';
      ctx.fillRect(px + s * 0.22 + sway, py + s * 0.05, s * 0.55, s * 0.35);
    } else if (type === 2) {
      // Pine
      ctx.fillStyle = '#14532d';
      ctx.fillRect(px + s * 0.2 + sway, py + s * 0.25, s * 0.6, s * 0.35);
      ctx.fillStyle = '#166534';
      ctx.fillRect(px + s * 0.3 + sway, py + s * 0.05, s * 0.4, s * 0.28);
    } else {
      // Palm
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(px + s * 0.1 + sway, py + s * 0.12, s * 0.8, s * 0.25);
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(px + s * 0.25 + sway, py + s * 0.05, s * 0.5, s * 0.2);
    }
  }
}
