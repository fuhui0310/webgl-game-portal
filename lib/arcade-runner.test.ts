import { describe, expect, it } from "vitest";
import {
  boxesOverlap,
  createArcadeState,
  jump,
  tick,
} from "./arcade-runner";
import { RABBIT_SPRITE, spriteSize } from "./pixel-sprites";

const noSpawn = () => 1;
const dt = 1 / 60;

function runWithoutSpawning(
  state: ReturnType<typeof createArcadeState>,
  seconds: number,
) {
  let next = { ...state, spawnTimer: 99 };
  const steps = Math.ceil(seconds / dt);
  for (let i = 0; i < steps; i += 1) {
    next = tick(next, dt, noSpawn);
  }
  return next;
}

describe("createArcadeState", () => {
  it("places the player on the ground and waits for the first jump", () => {
    const state = createArcadeState();

    expect(state.status).toBe("ready");
    expect(state.score).toBe(0);
    expect(state.obstacles).toEqual([]);
    expect(state.player.grounded).toBe(true);
    expect(state.player.x).toBe(Math.round(state.worldWidth / 3));
    expect(state.player.x).toBeGreaterThan(state.worldWidth * 0.25);
    expect(state.player.width).toBe(spriteSize(RABBIT_SPRITE).width);
    expect(state.player.height).toBe(spriteSize(RABBIT_SPRITE).height);
    expect(state.player.y + state.player.height).toBe(state.groundY);
  });
});

describe("jump", () => {
  it("starts the run and lifts the player off the ground", () => {
    const state = jump(createArcadeState());

    expect(state.status).toBe("running");
    expect(state.player.grounded).toBe(false);
    expect(state.player.vy).toBeLessThan(0);
  });

  it("ignores extra jumps while the player is airborne", () => {
    const airborne = jump(createArcadeState());
    const ignored = jump(airborne);

    expect(ignored.player.vy).toBe(airborne.player.vy);
    expect(ignored.player.y).toBe(airborne.player.y);
  });

  it("restarts a finished run without keeping the old score", () => {
    const over = {
      ...createArcadeState(),
      status: "gameover" as const,
      score: 42,
    };

    const restarted = jump(over);
    expect(restarted.status).toBe("running");
    expect(restarted.score).toBe(0);
    expect(restarted.player.grounded).toBe(true);
  });
});

describe("tick", () => {
  it("applies gravity and lands the player back on the ground", () => {
    const landed = runWithoutSpawning(jump(createArcadeState()), 2);

    expect(landed.player.grounded).toBe(true);
    expect(landed.player.y + landed.player.height).toBe(landed.groundY);
    expect(landed.player.vy).toBe(0);
  });

  it("moves obstacles from right to left and awards score", () => {
    const state = createArcadeState();
    const withObstacle = {
      ...state,
      status: "running" as const,
      spawnTimer: 99,
      obstacles: [
        {
          x: 400,
          y: state.groundY - 24,
          width: 16,
          height: 24,
          kind: "cactus" as const,
        },
      ],
    };

    const next = tick(withObstacle, dt, noSpawn);
    expect(next.obstacles[0]?.x).toBeLessThan(400);
    expect(next.score).toBeGreaterThan(0);
  });

  it("ends the game when the player overlaps an obstacle", () => {
    const state = createArcadeState();
    const colliding = {
      ...state,
      status: "running" as const,
      spawnTimer: 99,
      obstacles: [
        {
          x: state.player.x,
          y: state.player.y,
          width: state.player.width,
          height: state.player.height,
          kind: "brick" as const,
        },
      ],
    };

    const next = tick(colliding, dt, noSpawn);
    expect(next.status).toBe("gameover");
  });

  it("spawns a new obstacle when the timer elapses", () => {
    const state = {
      ...createArcadeState(),
      status: "running" as const,
      spawnTimer: 0,
    };

    const next = tick(state, dt, () => 0);
    expect(next.obstacles).toHaveLength(1);
    expect(next.obstacles[0]?.x).toBe(state.worldWidth);
  });
});

describe("boxesOverlap", () => {
  it("detects intersecting axis-aligned boxes", () => {
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 },
      ),
    ).toBe(true);
  });

  it("returns false when boxes are only adjacent", () => {
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 },
      ),
    ).toBe(false);
  });
});
