import { SPRITES } from './Sprites';
import { TileType } from './types';
import { World } from './World';

const SUB = 4; // 4x4 sub-pixels per tile for high-detail pixel art

function hash2D(x: number, y: number): number {
  let value = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

// Smooth deterministic noise shared across tile boundaries makes the ground
// read as connected patches instead of a checkerboard of identical squares.
function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2D(x0, y0);
  const b = hash2D(x0 + 1, y0);
  const c = hash2D(x0, y0 + 1);
  const d = hash2D(x0 + 1, y0 + 1);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

const TILE_BASE: Record<TileType, [number, number, number][]> = {
  [TileType.DEEP_WATER]: [
    [44, 107, 179],
    [40, 100, 170],
    [48, 114, 188],
    [36, 94, 162],
  ],
  [TileType.SHALLOW_WATER]: [
    [75, 163, 227],
    [84, 174, 236],
    [68, 154, 218],
    [94, 186, 242],
  ],
  [TileType.SAND]: [
    [242, 216, 143],
    [235, 208, 134],
    [248, 224, 154],
    [228, 200, 126],
  ],
  [TileType.SOIL]: [
    [134, 94, 58],
    [126, 88, 54],
    [142, 102, 64],
    [118, 82, 50],
  ],
  [TileType.GRASS]: [
    [70, 151, 59],
    [66, 141, 55],
    [80, 164, 65],
    [59, 132, 49],
  ],
  [TileType.FOREST]: [
    [45, 108, 44],
    [40, 98, 40],
    [53, 117, 48],
    [36, 91, 36],
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
        // Use index 0 as unified base so tile grid seams disappear
        const base = TILE_BASE[tile][0];

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

            // Deterministic micro-hash plus a larger shared ground pattern.
            const hash = ((x * 73856093) ^ (y * 19349663) ^ (sx * 83492791) ^ (sy * 2971215073)) & 15;
            const gx = x * SUB + sx;
            const gy = y * SUB + sy;

            // Give the terrain connected pixel clusters; world-space noise never
            // resets at tile boundaries, so color patches read as a continuous map.
            if (tile === TileType.GRASS || tile === TileType.FOREST) {
              const ground =
                valueNoise(gx / 9, gy / 9) * 0.48 +
                valueNoise(gx / 3.5, gy / 3.5) * 0.32 +
                valueNoise(gx / 1.7, gy / 1.7) * 0.2;
              if (ground > 0.64) {
                r += 8;
                g += 15;
                b += 5;
              } else if (ground < 0.34) {
                r -= 8;
                g -= 13;
                b -= 6;
              }
              const fleck = hash2D(gx + 83, gy + 191);
              if (fleck > 0.94) {
                r += 6;
                g += 10;
                b += 3;
              } else if (fleck < 0.05) {
                r -= 5;
                g -= 8;
                b -= 4;
              }
              if (hash === 1) {
                r += 5;
                g += 9;
                b += 3;
              } else if (hash === 5) {
                r -= 7;
                g -= 9;
                b -= 5;
              }
            } else if (tile === TileType.SAND) {
              const dune =
                valueNoise(gx / 8, gy / 8) * 0.65 +
                valueNoise(gx / 2.8, gy / 2.8) * 0.35;
              if (dune > 0.62) {
                r += 9;
                g += 8;
                b += 3;
              } else if (dune < 0.34 || hash === 2) {
                r -= 10;
                g -= 9;
                b -= 6;
              }
            } else if (tile === TileType.SOIL) {
              const earth =
                valueNoise(gx / 6, gy / 6) * 0.62 +
                valueNoise(gx / 2.3, gy / 2.3) * 0.38;
              if (earth > 0.66) {
                r += 12;
                g += 8;
                b += 4;
              } else if (earth < 0.34 || hash === 3) {
                r -= 12;
                g -= 10;
                b -= 7;
              }
            } else if (tile === TileType.DEEP_WATER || tile === TileType.SHALLOW_WATER) {
              const ripple =
                valueNoise(gx / 7, gy / 7) * 0.7 +
                valueNoise(gx / 2.5, gy / 2.5) * 0.3;
              if (ripple > 0.67) {
                r += 9;
                g += 13;
                b += 17;
              } else if (ripple < 0.34) {
                r -= 8;
                g -= 6;
                b -= 3;
              }
            } else if (tile === TileType.HILL || tile === TileType.MOUNTAIN) {
              const stone =
                valueNoise(gx / 7, gy / 7) * 0.62 +
                valueNoise(gx / 2.1, gy / 2.1) * 0.38;
              if (stone > 0.69) {
                r += 11;
                g += 11;
                b += 13;
              } else if (stone < 0.31) {
                r -= 12;
                g -= 12;
                b -= 10;
              }
              if (hash === 2) {
                r += 6;
                g += 6;
                b += 7;
              }
            } else if (tile === TileType.SNOW) {
              if (hash < 2) {
                r += 8;
                g += 9;
                b += 10;
              } else if (hash === 5) {
                r -= 9;
                g -= 8;
                b -= 6;
              }
            } else if (tile === TileType.ASH && hash === 4) {
              r = 180;
              g = 65;
              b = 20;
            }

            // Rounded corner auto-tiling for organic coastlines & cliffs
            if (tile > TileType.SHALLOW_WATER) {
              const isTopLeft = sx === 0 && sy === 0 && up < tile && left < tile;
              const isTopRight = sx === SUB - 1 && sy === 0 && up < tile && right < tile;
              const isBotLeft = sx === 0 && sy === SUB - 1 && down < tile && left < tile;
              const isBotRight = sx === SUB - 1 && sy === SUB - 1 && down < tile && right < tile;
              if (isTopLeft || isTopRight || isBotLeft || isBotRight) {
                const lower = TILE_BASE[down < tile ? (down as TileType) : (up as TileType)][0];
                r = lower[0];
                g = lower[1];
                b = lower[2];
              }
            }

            // Land edge bevel shadow on bottom edge next to water
            if (tile === TileType.SAND && sy === SUB - 1 && down <= TileType.SHALLOW_WATER) {
              r -= 32;
              g -= 28;
              b -= 20;
            }

            // Shoreline foam on shallow water next to land
            if (tile === TileType.SHALLOW_WATER) {
              const nearLand =
                (sy === 0 && up > TileType.SHALLOW_WATER) ||
                (sy === SUB - 1 && down > TileType.SHALLOW_WATER) ||
                (sx === 0 && left > TileType.SHALLOW_WATER) ||
                (sx === SUB - 1 && right > TileType.SHALLOW_WATER);
              if (nearLand) {
                r = 185;
                g = 228;
                b = 248;
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
        // Tiny flowers, shrubs, and grass tufts add scale without cluttering the ground.
        if ((tile === TileType.GRASS || tile === TileType.FOREST) && tree === 0 && tileSize >= 4) {
          const dHash = ((x * 92821) ^ (y * 68917)) & 63;
          if (dHash === 3) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(px + tileSize * 0.3, py + tileSize * 0.4, Math.max(1.5, tileSize * 0.2), Math.max(1.5, tileSize * 0.2));
          } else if (dHash === 11) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(px + tileSize * 0.6, py + tileSize * 0.3, Math.max(1.5, tileSize * 0.2), Math.max(1.5, tileSize * 0.2));
          } else if (dHash === 19) {
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(px + tileSize * 0.45, py + tileSize * 0.65, Math.max(1.5, tileSize * 0.18), Math.max(1.5, tileSize * 0.18));
          } else if (dHash === 27) {
            // Keep small props on the same chunky pixel scale as the canopy art.
            ctx.drawImage(SPRITES.bush, px - tileSize * 0.05, py + tileSize * 0.12, tileSize * 1.1, tileSize * 0.72);
          } else if (dHash === 41) {
            ctx.drawImage(SPRITES.grassTuft, px + tileSize * 0.12, py + tileSize * 0.15, tileSize * 0.76, tileSize * 0.76);
          } else if (dHash === 53) {
            ctx.drawImage(SPRITES.flower, px + tileSize * 0.1, py + tileSize * 0.12, tileSize * 0.8, tileSize * 0.8);
          } else if (dHash === 7) {
            ctx.drawImage(SPRITES.grassTuft, px + tileSize * 0.06, py + tileSize * 0.08, tileSize * 0.88, tileSize * 0.88);
          } else if (dHash === 47) {
            ctx.drawImage(SPRITES.flower, px + tileSize * 0.02, py + tileSize * 0.08, tileSize * 0.96, tileSize * 0.9);
          }
        }

        // Detailed Pixel Trees
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
    const sway = Math.sin(phase * 1.6) * s * 0.025;
    const tileX = Math.floor(px / s);
    const tileY = Math.floor(py / s);
    const treeVariant = (tileX * 17 + tileY * 31) & 3;
    const sprite =
      type === 1
        ? treeVariant === 0 ? SPRITES.oakAlt : SPRITES.oak
        : type === 2 ? SPRITES.pine : SPRITES.palm;

    // Keep canopies distinct at map scale; slight per-tree size differences and
    // two oak silhouettes prevent the forest from reading as a repeated stamp.
    const sizeVariation = [0.92, 1.04, 0.98, 1.08][treeVariant];
    const pixelScale = (s / 10) * sizeVariation;
    const drawW = sprite.width * pixelScale;
    const drawH = sprite.height * pixelScale;

    // A compact shadow under the trunk grounds the tree without a soft blur.
    ctx.fillStyle = 'rgba(15, 32, 20, 0.42)';
    ctx.fillRect(px + s * 0.12, py + s * 0.82, s * 0.78, Math.max(1, s * 0.16));

    const drawX = px + s * 0.5 - drawW * 0.5 + sway;
    const drawY = py + s - drawH;
    const flip = (treeVariant & 1) === 1;
    if (flip) {
      // Mirroring the handcrafted sprite gives nearby trees a less stamped look.
      ctx.save();
      ctx.translate(px + s * 0.5, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(px + s * 0.5), 0);
    }
    ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    if (flip) ctx.restore();
  }
}
