export interface Player {
  id: string;
  name: string;
  colorIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  inGoal: boolean;
  isPushingRight?: boolean;
  isPushingLeft?: boolean;
  isRidingPlayerId?: string | null;
  squash: number; // for stretch/squash jump animation
  walkFrame: number;
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  mass: number; // required pushers (e.g. 2 players)
  color?: string;
  activePushers?: number;
}

export interface ButtonObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pressed: boolean;
  color: string;
  targetId: string; // target door or bridge
  isLatched?: boolean; // if true, stays pressed once activated
}

export interface DoorObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  progress: number; // 0 (closed) to 1 (open)
  requiresKey?: boolean;
}

export interface KeyObject {
  id: string;
  x: number;
  y: number;
  pickedBy: string | null; // player id
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  currentT: number;
  direction: number;
  behavior?: 'automatic' | 'stepToActivate' | 'buttonRequired';
  activeOnlyWhenButtonPressed?: string;
  hasRider?: boolean;
  riderWaitTimer?: number;
  prevX?: number;
  prevY?: number;
}

export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'ground' | 'wall' | 'hazard' | 'ice';
}

export interface LevelData {
  id: number;
  worldNumber?: number;
  name: string;
  subtitle: string;
  description: string;
  coopTip: string;
  minPlayersNeeded: number;
  width: number;
  height: number;
  spawnPoints: { x: number; y: number }[];
  platforms: TileRect[];
  hazards: TileRect[]; // pits or spikes
  goal: { x: number; y: number; width: number; height: number };
  boxes: Box[];
  buttons: ButtonObject[];
  doors: DoorObject[];
  keys: KeyObject[];
  movingPlatforms: MovingPlatform[];
  // Special World Gimmicks from Pico Park 2
  worldRefId?: number;
  timeLimit?: number; // for World 5 Time Limit
  hasDistanceSensor?: boolean; // for World 2 Distance
  maxDistanceAllowed?: number;
  hasStopAndGo?: boolean; // for World 7 Stop and Go
  stopAndGoCycle?: { green: number; red: number };
  hasBulletHell?: boolean; // for World 11 Parkful Dodger
  bulletHellDuration?: number;
  hasGravityInversion?: boolean; // for World 13 Special Park
  hasAutoscroll?: boolean; // for World 12 Go Go Go
  autoscrollSpeed?: number;
}

export const PLAYER_COLORS = [
  { name: 'Verde', hex: '#22c55e', border: '#15803d', eye: '#ffffff' },
  { name: 'Laranja', hex: '#f97316', border: '#c2410c', eye: '#ffffff' },
  { name: 'Ciano', hex: '#06b6d4', border: '#0e7490', eye: '#ffffff' },
  { name: 'Roxo', hex: '#a855f7', border: '#7e22ce', eye: '#ffffff' },
  { name: 'Amarelo', hex: '#eab308', border: '#a16207', eye: '#ffffff' },
  { name: 'Coral', hex: '#f43f5e', border: '#be123c', eye: '#ffffff' },
  { name: 'Rosa', hex: '#ec4899', border: '#be185d', eye: '#ffffff' },
  { name: 'Azul', hex: '#3b82f6', border: '#1d4ed8', eye: '#ffffff' },
];
