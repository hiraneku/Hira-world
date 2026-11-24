import { TileType } from './types';
import { World } from './World';

const SUB = 4; // 4x4 sub-pixels per tile for high-detail pixel art

const TILE_BASE: Record<TileType, [number, number, number][]> = {
  [TileType.DEEP_WATER]: [
    [18, 52, 108],
    [16, 48, 100],
    [22, 58, 118],
    [14, 44, 94],
  ],
  [TileType.SHALLOW_WATER]: [
    [42, 128, 198],
    [48, 136, 206],
    [38, 120, 188],
    [52, 142, 212],
  ],
  [TileType.SAND]: [
    [236, 212, 146],
    [228, 204, 138],
    [242, 220, 158],
    [220, 196, 130],
  ],
  [TileType.SOIL]: [
    [134, 94, 58],
    [126, 88, 54],
    [142, 102, 64],
    [118, 82, 50],
  ],
  [TileType.GRASS]: [
    [78, 166, 68],
    [72, 156, 62],
    [88, 176, 76],
    [66, 148, 58],
  ],
  [TileType.FOREST]: [
    [56, 128, 50],
    [50, 120, 46],
    [62, 136, 56],
    [46, 112, 42],
  ],
  [TileType.HILL]: [
    [116, 122, 130],
    [108, 114, 122],
    [126, 132, 140],
    [100, 106, 114],
  ],
  [TileType.MOUNTAIN]: [
    [82, 86, 94],
    [74, 78, 86],
    [92, 96, 104],
    [68, 72, 80],
  ],
  [TileType.SNOW]: [
    [236, 244, 252],
    [228, 238, 248],
    [244, 250, 255],
    [218, 230, 242],
  ],
  [TileType.LAVA]: [
    [225, 58, 16],
    [245, 96, 20],
    [200, 40, 12],
    [252, 140, 28],
  ],
  [TileType.ASH]: [
    [62, 60, 64],
    [56, 54, 58],
    [70, 68, 72],
    [50, 48, 52],
  ],
};

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export class Renderer {
  private terrainCanvas: HTMLCanvasElement;
  private terrainCtx: CanvasRenderingContext2D;
  private terrainImageData: ImageData;

  constructor(world: World) {
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = world.width * SUB;
    this.terrainCanvas.height = world.height * SUB;
    const ctx = this.terrainCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create offscreen 2D context');
    this.terrainCtx = ctx;
    this.terrainImageData = ctx.createImageData(
      world.width * SUB,
      world.height * SUB
    );
  }

  private setSubPixel(
    data: Uint8ClampedArray,
    imgW: number,
    px: number,
    py: number,
    r: number,
    g: number,
    b: number
  ): void {
    const p = (py * imgW + px) * 4;
    data[p] = Math.max(0, Math.min(255, r));
    data[p + 1] = Math.max(0, Math.min(255, g));
    data[p + 2] = Math.max(0, Math.min(255, b));
    data[p + 3] = 255;
  }

  private updateTerrainTexture(world: World): void {
    const data = this.terrainImageData.data;
    const w = world.width;
    const h = world.height;
    const imgW = w * SUB;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const tile = world.tiles[idx] as TileType;
        const variant = world.tileVariant[idx];
        const base = TILE_BASE[tile][variant];

        // Neighbor checks for edge shading / shorelines
        const up = y > 0 ? world.tiles[(y - 1) * w + x] : tile;
        const down = y < h - 1 ? world.tiles[(y + 1) * w + x] : tile;
        const left = x > 0 ? world.tiles[y * w + (x - 1)] : tile;
        const right = x < w - 1 ? world.tiles[y * w + (x + 1)] : tile;

        for (let sy = 0; sy < SUB; sy++) {
          for (let sx = 0; sx < SUB; sx++) {
            let r = base[0];
            let g = base[1];
            let b = base[2];

            // Deterministic micro-hash per subpixel
            const hash = ((x * 73856093) ^ (y * 19349663) ^ (sx * 83492791) ^ (sy * 2971215073)) & 15;

            // Micro-texture details
            if (tile === TileType.GRASS || tile === TileType.FOREST) {
              if (hash === 1 || hash === 9) {
                r += 16;
                g += 22;
                b += 10;
              } else if (hash === 5) {
                r -= 14;
                g -= 18;
                b -= 10;
              }
            } else if (tile === TileType.SAND) {
              if (hash === 2) {
                r -= 16;
                g -= 14;
                b -= 12;
              } else if (hash === 11) {
                r += 10;
                g += 10;
                b += 8;
              }
            } else if (tile === TileType.SOIL) {
              if (hash === 3 || hash === 12) {
                r -= 18;
                g -= 14;
                b -= 10;
              }
            } else if (tile === TileType.HILL || tile === TileType.MOUNTAIN) {
              if (hash < 3) {
                r += 14;
                g += 14;
                b += 16;
              } else if (hash === 14) {
                r -= 18;
                g -= 18;
                b -= 16;
              }
            } else if (tile === TileType.ASH && hash === 4) {
              // Glowing ember speck in ash
              r = 180;
              g = 65;
              b = 20;
            }

            // Shoreline foam on shallow water next to land
            if (tile === TileType.SHALLOW_WATER) {
              const nearLand =
                (sy === 0 && up > TileType.SHALLOW_WATER) ||
                (sy === SUB - 1 && down > TileType.SHALLOW_WATER) ||
                (sx === 0 && left > TileType.SHALLOW_WATER) ||
                (sx === SUB - 1 && right > TileType.SHALLOW_WATER);
              if (nearLand && hash % 2 === 0) {
                r = 195;
                g = 232;
                b = 250;
              }
            }

            // Cliff / elevation shadow on lower/right edges
            if (tile === TileType.HILL || tile === TileType.MOUNTAIN || tile === TileType.SNOW) {
              if (sy === SUB - 1 && down < tile) {
                r -= 28;
                g -= 28;
                b -= 24;
              }
              if (sy === 0 && up < tile) {
                r += 16;
                g += 16;
                b += 18;
              }
            }

            this.setSubPixel(data, imgW, x * SUB + sx, y * SUB + sy, r, g, b);
          }
        }
      }
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
    ctx.fillStyle = '#080e1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const tileSize = camera.zoom;
    const offsetX = Math.floor(canvasWidth * 0.5 - camera.x * tileSize);
    const offsetY = Math.floor(canvasHeight * 0.5 - camera.y * tileSize);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // 1. Draw high-detail 4x4 subpixel terrain
    ctx.drawImage(
      this.terrainCanvas,
      0,
      0,
      world.width * tileSize,
      world.height * tileSize
    );

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

    // 2. Animated Water, Lava, Trees, and Fire
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const idx = y * world.width + x;
        const tile = world.tiles[idx];
        const px = x * tileSize;
        const py = y * tileSize;

        // Animated water waves
        if (tile === TileType.SHALLOW_WATER || tile === TileType.DEEP_WATER) {
          const wave = Math.sin(timeSec * 2.8 + x * 0.55 + y * 0.35);
          if (wave > 0.78) {
            const shift = ((timeSec * 0.6 + y * 0.2) % 1) * tileSize * 0.25;
            ctx.fillStyle =
              tile === TileType.SHALLOW_WATER
                ? 'rgba(224, 246, 255, 0.28)'
                : 'rgba(147, 197, 253, 0.16)';
            ctx.fillRect(
              px + shift,
              py + tileSize * 0.35,
              tileSize * 0.55,
              Math.max(1, tileSize * 0.14)
            );
          }
        }

        // Animated glowing lava crust & magma pulse
        if (tile === TileType.LAVA) {
          const pulse = Math.sin(timeSec * 3.5 + x * 0.9 + y * 0.7) * 0.5 + 0.5;
          if (pulse > 0.65) {
            ctx.fillStyle = '#fde047';
            ctx.fillRect(
              px + tileSize * 0.25,
              py + tileSize * 0.25,
              tileSize * 0.4,
              tileSize * 0.4
            );
          } else if (pulse < 0.25) {
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(
              px + tileSize * 0.15,
              py + tileSize * 0.5,
              tileSize * 0.35,
              tileSize * 0.25
            );
          }
        }

        // Detailed Pixel Trees
        const tree = world.trees[idx];
        if (tree !== 0 && tileSize >= 3) {
          this.drawPixelTree(ctx, px, py, tileSize, tree, timeSec + x * 0.35);
        }

        // Layered Pixel Fire
        const fire = world.fire[idx];
        if (fire > 0) {
          const f1 = Math.sin(timeSec * 16 + x * 3.1 + y * 5.7) * 0.5 + 0.5;
          const f2 = Math.cos(timeSec * 22 + x * 4.3 + y * 2.1) * 0.5 + 0.5;
          // Outer red-orange flame
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(
            px + tileSize * 0.12,
            py + tileSize * (0.12 + f1 * 0.14),
            tileSize * 0.76,
            tileSize * 0.76
          );
          // Middle bright orange
          ctx.fillStyle = '#f97316';
          ctx.fillRect(
            px + tileSize * 0.22,
            py + tileSize * (0.2 + f2 * 0.14),
            tileSize * 0.56,
            tileSize * 0.62
          );
          // Inner yellow core
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(
            px + tileSize * 0.34,
            py + tileSize * (0.38 + f1 * 0.1),
            tileSize * 0.32,
            tileSize * 0.38
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
    const sway = Math.sin(phase * 1.6) * s * 0.04;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(px + s * 0.22, py + s * 0.78, s * 0.6, s * 0.16);

    // Trunk
    ctx.fillStyle = '#4a2e16';
    ctx.fillRect(px + s * 0.4, py + s * 0.46, Math.max(1, s * 0.2), s * 0.42);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(px + s * 0.42, py + s * 0.46, Math.max(1, s * 0.08), s * 0.42);

    if (type === 1) {
      // Oak: 3-tone layered pixel canopy
      ctx.fillStyle = '#14532d';
      ctx.fillRect(px + s * 0.14 + sway, py + s * 0.18, s * 0.72, s * 0.42);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(px + s * 0.18 + sway, py + s * 0.1, s * 0.64, s * 0.36);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px + s * 0.26 + sway, py + s * 0.08, s * 0.34, s * 0.18);
    } else if (type === 2) {
      // Pine: tiered dark-green triangles
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(px + s * 0.18 + sway, py + s * 0.34, s * 0.64, s * 0.26);
      ctx.fillStyle = '#047857';
      ctx.fillRect(px + s * 0.26 + sway, py + s * 0.18, s * 0.48, s * 0.22);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(px + s * 0.36 + sway, py + s * 0.04, s * 0.28, s * 0.18);
    } else {
      // Palm: curved fronds
      ctx.fillStyle = '#3f6212';
      ctx.fillRect(px + s * 0.08 + sway, py + s * 0.16, s * 0.84, s * 0.2);
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(px + s * 0.2 + sway, py + s * 0.08, s * 0.6, s * 0.18);
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(px + s * 0.32 + sway, py + s * 0.06, s * 0.36, s * 0.1);
    }
  }
}
