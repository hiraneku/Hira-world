export enum TileType {
  DEEP_WATER = 0,
  SHALLOW_WATER = 1,
  SAND = 2,
  SOIL = 3,
  GRASS = 4,
  FOREST = 5,
  HILL = 6,
  MOUNTAIN = 7,
  SNOW = 8,
  LAVA = 9,
  ASH = 10,
}

export type ToolCategory = 'terrain' | 'nature' | 'disasters';

export type ToolId =
  | 'deep_water'
  | 'shallow_water'
  | 'sand'
  | 'soil'
  | 'grass'
  | 'hill'
  | 'mountain'
  | 'snow'
  | 'forest_trees'
  | 'rain'
  | 'fire'
  | 'lava'
  | 'bomb'
  | 'meteor';

export interface ToolDef {
  id: ToolId;
  name: string;
  category: ToolCategory;
  isInstant?: boolean; // e.g., bomb, meteor
}

export const TOOLS: ToolDef[] = [
  // Terrain
  { id: 'deep_water', name: 'Deep Sea', category: 'terrain' },
  { id: 'shallow_water', name: 'Shallow', category: 'terrain' },
  { id: 'sand', name: 'Sand', category: 'terrain' },
  { id: 'soil', name: 'Soil', category: 'terrain' },
  { id: 'grass', name: 'Grass', category: 'terrain' },
  { id: 'hill', name: 'Hills', category: 'terrain' },
  { id: 'mountain', name: 'Mountain', category: 'terrain' },
  { id: 'snow', name: 'Snow', category: 'terrain' },

  // Nature
  { id: 'forest_trees', name: 'Trees', category: 'nature' },
  { id: 'rain', name: 'Rain', category: 'nature' },

  // Disasters
  { id: 'fire', name: 'Fire', category: 'disasters' },
  { id: 'lava', name: 'Lava', category: 'disasters' },
  { id: 'bomb', name: 'Bomb', category: 'disasters', isInstant: true },
  { id: 'meteor', name: 'Meteor', category: 'disasters', isInstant: true },
];

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
