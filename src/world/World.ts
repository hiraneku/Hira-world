import { Noise2D } from './noise';
import { Particle, TileType, ToolId } from './types';

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;

export class World {
  public readonly width: number;
  public readonly height: number;
  public tiles: Uint8Array;
  public trees: Uint8Array; // 0 = none, 1 = oak, 2 = pine, 3 = palm
  public fire: Uint8Array;  // 0 = none, 1..255 = burn timer
  public tileVariant: Uint8Array; // 0..3 for pixel dithering
  public particles: Particle[] = [];

  public terrainDirty = true;
  public year = 1;
  public seasonIndex = 0;
  private timeAccumulator = 0;
  private simAccumulator = 0;
  public treeCount = 0;

  constructor(width = 160, height = 100) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.tiles = new Uint8Array(size);
    this.trees = new Uint8Array(size);
    this.fire = new Uint8Array(size);
    this.tileVariant = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
      this.tileVariant[i] = Math.floor(Math.random() * 4);
    }

    this.generate();
  }

  public generate(seed = Math.random() * 100000): void {
    const elevNoise = new Noise2D(seed);
    const moistNoise = new Noise2D(seed + 1337);
    this.fire.fill(0);
    this.trees.fill(0);
    this.particles = [];
    this.treeCount = 0;
    this.year = 1;
    this.seasonIndex = 0;

    const cx = this.width * 0.5;
    const cy = this.height * 0.5;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = y * this.width + x;
        const nx = x / 28;
        const ny = y / 28;

        let e = elevNoise.fbm(nx, ny, 5);
        const dx = (x - cx) / cx;
        const dy = (y - cy) / cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Island falloff so edges are ocean
        e = e - Math.pow(dist, 2.1) * 0.48 + 0.08;

        const m = moistNoise.fbm(nx * 1.4, ny * 1.4, 3);

        let tile = TileType.DEEP_WATER;
        if (e < 0.34) {
          tile = TileType.DEEP_WATER;
        } else if (e < 0.41) {
          tile = TileType.SHALLOW_WATER;
        } else if (e < 0.45) {
          tile = TileType.SAND;
          if (m > 0.56 && Math.random() < 0.14) {
            this.trees[idx] = 3; // palm
            this.treeCount++;
          }
        } else if (e < 0.64) {
          // Moist pockets become darker woodland clearings, not just one flat
          // green carpet. Higher tree odds make those pockets read as forests.
          tile = m > 0.58 ? TileType.FOREST : m > 0.43 ? TileType.GRASS : TileType.SOIL;
          const treeChance = tile === TileType.FOREST ? 0.68 : 0.42;
          if ((tile === TileType.GRASS || tile === TileType.FOREST) && m > 0.49 && Math.random() < treeChance) {
            this.trees[idx] = 1; // oak
            this.treeCount++;
          }
        } else if (e < 0.74) {
          tile = TileType.HILL;
          if (m > 0.5 && Math.random() < 0.22) {
            this.trees[idx] = 2; // pine
            this.treeCount++;
          }
        } else if (e < 0.83) {
          tile = TileType.MOUNTAIN;
        } else {
          tile = TileType.SNOW;
        }

        // Prevent unused warning
        void maxDist;
        this.tiles[idx] = tile;
      }
    }

    this.terrainDirty = true;
  }

  public inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  public applyTool(tool: ToolId, cx: number, cy: number, radius: number): void {
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));

    if (tool === 'bomb' || tool === 'meteor') {
      const blastR = tool === 'meteor' ? Math.max(radius + 3, 6) : Math.max(radius + 1, 4);
      const blastR2 = blastR * blastR;
      const bMinX = Math.max(0, Math.floor(cx - blastR));
      const bMaxX = Math.min(this.width - 1, Math.ceil(cx + blastR));
      const bMinY = Math.max(0, Math.floor(cy - blastR));
      const bMaxY = Math.min(this.height - 1, Math.ceil(cy + blastR));

      for (let y = bMinY; y <= bMaxY; y++) {
        for (let x = bMinX; x <= bMaxX; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 > blastR2) continue;
          const idx = y * this.width + x;

          if (this.trees[idx] !== 0) {
            this.trees[idx] = 0;
            this.treeCount = Math.max(0, this.treeCount - 1);
          }

          if (d2 < blastR2 * 0.35) {
            this.tiles[idx] = TileType.SHALLOW_WATER;
            this.fire[idx] = 0;
          } else if (d2 < blastR2 * 0.72) {
            this.tiles[idx] = TileType.ASH;
            if (Math.random() < 0.45) this.fire[idx] = 120;
          } else if (this.tiles[idx] > TileType.SHALLOW_WATER) {
            this.tiles[idx] = TileType.SOIL;
            if (Math.random() < 0.25) this.fire[idx] = 80;
          }
        }
      }

      // Explosion particles
      const count = tool === 'meteor' ? 45 : 28;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 18;
        this.particles.push({
          x: cx + 0.5,
          y: cy + 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.4 + Math.random() * 0.6,
          maxLife: 1.0,
          color: Math.random() < 0.5 ? '#fb923c' : '#fde047',
          size: 2 + Math.random() * 2,
        });
      }
      this.terrainDirty = true;
      return;
    }

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > r2) continue;

        const idx = y * this.width + x;
        const current = this.tiles[idx];

        switch (tool) {
          case 'deep_water':
          case 'shallow_water':
            this.setTile(
              idx,
              tool === 'deep_water' ? TileType.DEEP_WATER : TileType.SHALLOW_WATER
            );
            this.fire[idx] = 0;
            break;
          case 'sand':
            this.setTile(idx, TileType.SAND);
            break;
          case 'soil':
            this.setTile(idx, TileType.SOIL);
            break;
          case 'grass':
            this.setTile(idx, TileType.GRASS);
            break;
          case 'hill':
            this.setTile(idx, TileType.HILL);
            break;
          case 'mountain':
            this.setTile(idx, TileType.MOUNTAIN);
            break;
          case 'snow':
            this.setTile(idx, TileType.SNOW);
            break;
          case 'lava':
            if (current === TileType.DEEP_WATER || current === TileType.SHALLOW_WATER) {
              this.setTile(idx, TileType.HILL); // Obsidian/rock
            } else {
              this.setTile(idx, TileType.LAVA);
              this.fire[idx] = 0;
            }
            break;
          case 'forest_trees':
            if (
              (current === TileType.GRASS ||
                current === TileType.SOIL ||
                current === TileType.SAND ||
                current === TileType.HILL) &&
              this.trees[idx] === 0 &&
              Math.random() < 0.45
            ) {
              if (current === TileType.SAND) this.trees[idx] = 3;
              else if (current === TileType.HILL) this.trees[idx] = 2;
              else this.trees[idx] = 1;
              this.treeCount++;
            }
            break;
          case 'fire':
            if (current !== TileType.DEEP_WATER && current !== TileType.SHALLOW_WATER) {
              this.fire[idx] = 140 + Math.floor(Math.random() * 80);
            }
            break;
          case 'rain':
            this.fire[idx] = 0;
            if (current === TileType.LAVA) {
              this.setTile(idx, TileType.HILL);
            } else if (current === TileType.ASH || current === TileType.SOIL) {
              if (Math.random() < 0.35) this.setTile(idx, TileType.GRASS);
            }
            if (Math.random() < 0.25) {
              this.particles.push({
                x: x + Math.random(),
                y: y - 1.5,
                vx: -0.5,
                vy: 14 + Math.random() * 6,
                life: 0.22,
                maxLife: 0.22,
                color: '#60a5fa',
                size: 1.5,
              });
            }
            break;
        }
      }
    }
  }

  private setTile(idx: number, tile: TileType): void {
    if (this.tiles[idx] !== tile) {
      this.tiles[idx] = tile;
      this.terrainDirty = true;
    }
    if (
      tile === TileType.DEEP_WATER ||
      tile === TileType.SHALLOW_WATER ||
      tile === TileType.MOUNTAIN ||
      tile === TileType.LAVA
    ) {
      if (this.trees[idx] !== 0) {
        this.trees[idx] = 0;
        this.treeCount = Math.max(0, this.treeCount - 1);
      }
    }
  }

  public update(dt: number, speedMultiplier: number): void {
    // Particles always animate smoothly
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (speedMultiplier <= 0) return;

    const simDt = dt * speedMultiplier;
    this.timeAccumulator += simDt;
    if (this.timeAccumulator >= 4) {
      this.timeAccumulator -= 4;
      this.seasonIndex = (this.seasonIndex + 1) % 4;
      if (this.seasonIndex === 0) this.year++;
    }

    this.simAccumulator += simDt;
    if (this.simAccumulator < 0.12) return;
    this.simAccumulator = 0;

    // Fire & Lava simulation step
    const w = this.width;
    const h = this.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const f = this.fire[idx];
        if (f > 0) {
          // Smoke particle
          if (Math.random() < 0.08 && this.particles.length < 350) {
            this.particles.push({
              x: x + 0.5,
              y: y + 0.2,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -2.5 - Math.random() * 2,
              life: 0.7,
              maxLife: 0.7,
              color: 'rgba(148, 163, 184, 0.7)',
              size: 2,
            });
          }

          // Spread to neighbors
          if (Math.random() < 0.12) {
            const nx = x + Math.floor(Math.random() * 3) - 1;
            const ny = y + Math.floor(Math.random() * 3) - 1;
            if (this.inBounds(nx, ny)) {
              const nIdx = ny * w + nx;
              const nTile = this.tiles[nIdx];
              if (
                this.fire[nIdx] === 0 &&
                (this.trees[nIdx] !== 0 || nTile === TileType.GRASS)
              ) {
                this.fire[nIdx] = 120;
              }
            }
          }

          // Burn down
          if (f <= 12) {
            this.fire[idx] = 0;
            if (this.trees[idx] !== 0) {
              this.trees[idx] = 0;
              this.treeCount = Math.max(0, this.treeCount - 1);
            }
            if (this.tiles[idx] === TileType.GRASS) {
              this.tiles[idx] = TileType.ASH;
              this.terrainDirty = true;
            }
          } else {
            this.fire[idx] = f - 10;
          }
        }
      }
    }
  }
}
