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
  icon: string;
  category: ToolCategory;
  isInstant?: boolean; // e.g., bomb, meteor
}

export const TOOLS: ToolDef[] = [
  // Terrain
  { id: 'deep_water', name: 'Deep Sea', icon: '🌊', category: 'terrain' },
  { id: 'shallow_water', name: 'Shallow', icon: '💧', category: 'terrain' },
  { id: 'sand', name: 'Sand', icon: '🏖️', category: 'terrain' },
  { id: 'soil', name: 'Soil', icon: '🟫', category: 'terrain' },
  { id: 'grass', name: 'Grass', icon: '🟩', category: 'terrain' },
  { id: 'hill', name: 'Hills', icon: '⛰️', category: 'terrain' },
  { id: 'mountain', name: 'Mountain', icon: '🗻', category: 'terrain' },
  { id: 'snow', name: 'Snow', icon: '❄️', category: 'terrain' },

  // Nature
  { id: 'forest_trees', name: 'Trees', icon: '🌲', category: 'nature' },
  { id: 'rain', name: 'Rain', icon: '🌧️', category: 'nature' },

  // Disasters
  { id: 'fire', name: 'Fire', icon: '🔥', category: 'disasters' },
  { id: 'lava', name: 'Lava', icon: '🌋', category: 'disasters' },
  { id: 'bomb', name: 'Bomb', icon: '💣', category: 'disasters', isInstant: true },
  { id: 'meteor', name: 'Meteor', icon: '☄️', category: 'disasters', isInstant: true },
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
