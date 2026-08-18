export type ArcadeStatus = "ready" | "running" | "gameover";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Player = Rect & {
  vy: number;
  grounded: boolean;
};

export type ArcadeState = {
  status: ArcadeStatus;
  player: Player;
  obstacles: Rect[];
  score: number;
  speed: number;
  spawnTimer: number;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
};

export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 240;
export const GROUND_Y = 200;
export const PLAYER_X = 72;
export const PLAYER_WIDTH = 22;
export const PLAYER_HEIGHT = 26;
export const GRAVITY = 2200;
export const JUMP_VELOCITY = -760;
export const BASE_SPEED = 280;
export const MAX_SPEED = 520;
export const SCORE_PER_SECOND = 12;

function createPlayer(): Player {
  return {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vy: 0,
    grounded: true,
  };
}

export function createArcadeState(): ArcadeState {
  return {
    status: "ready",
    player: createPlayer(),
    obstacles: [],
    score: 0,
    speed: BASE_SPEED,
    spawnTimer: 1.2,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    groundY: GROUND_Y,
  };
}

export function boxesOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function startRunning(): ArcadeState {
  return {
    ...createArcadeState(),
    status: "running",
  };
}

function applyJump(state: ArcadeState): ArcadeState {
  return {
    ...state,
    player: {
      ...state.player,
      vy: JUMP_VELOCITY,
      grounded: false,
    },
  };
}

export function jump(state: ArcadeState): ArcadeState {
  if (state.status === "gameover") {
    return startRunning();
  }

  if (state.status === "ready") {
    return applyJump({ ...state, status: "running" });
  }

  if (!state.player.grounded) {
    return state;
  }

  return applyJump(state);
}

function spawnObstacle(state: ArcadeState, random: () => number): Rect {
  const tall = random() > 0.55;
  const height = tall ? 36 : 22;
  const width = tall ? 18 : 14;

  return {
    x: state.worldWidth,
    y: state.groundY - height,
    width,
    height,
  };
}

function nextSpawnDelay(speed: number, random: () => number): number {
  const haste = Math.min((speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED), 1);
  const min = 0.75 - haste * 0.25;
  const span = 1.05 - haste * 0.35;
  return min + random() * span;
}

export function tick(
  state: ArcadeState,
  dt: number,
  random: () => number = Math.random,
): ArcadeState {
  if (state.status !== "running") {
    return state;
  }

  const speed = Math.min(BASE_SPEED + state.score * 2.4, MAX_SPEED);
  let player = { ...state.player };
  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;

  const floorY = state.groundY - player.height;
  if (player.y >= floorY) {
    player.y = floorY;
    player.vy = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  let spawnTimer = state.spawnTimer - dt;
  const obstacles = state.obstacles
    .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed * dt }))
    .filter((obstacle) => obstacle.x + obstacle.width > 0);

  if (spawnTimer <= 0) {
    obstacles.push(spawnObstacle(state, random));
    spawnTimer = nextSpawnDelay(speed, random);
  }

  const hit = obstacles.some((obstacle) => boxesOverlap(player, obstacle));

  return {
    ...state,
    status: hit ? "gameover" : "running",
    player,
    obstacles,
    score: state.score + SCORE_PER_SECOND * dt,
    speed,
    spawnTimer,
  };
}

export function displayScore(score: number): string {
  return Math.floor(score).toString().padStart(5, "0");
}
