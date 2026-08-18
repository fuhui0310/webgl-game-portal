import { describe, expect, it, vi } from "vitest";
import {
  CACTUS_SPRITE,
  PIXEL_SIZE,
  RABBIT_RUN_FRAME_MS,
  RABBIT_SPRITE,
  drawSprite,
  rabbitHitboxSize,
  rabbitJump,
  rabbitRun1,
  rabbitRun2,
  selectRabbitSprite,
  spriteSize,
} from "./pixel-sprites";

function isOneBit(matrix: number[][]) {
  return matrix.every((row) => row.every((cell) => cell === 0 || cell === 1));
}

describe("pixel sprites", () => {
  it("defines the rabbit as a 1-bit pixel matrix", () => {
    expect(RABBIT_SPRITE.length).toBeGreaterThan(8);
    expect(isOneBit(RABBIT_SPRITE)).toBe(true);
    expect(RABBIT_SPRITE.some((row) => row.includes(1))).toBe(true);
  });

  it("keeps run and jump frames on the same facing-right canvas", () => {
    const frames = [rabbitRun1, rabbitRun2, rabbitJump];
    const size = spriteSize(rabbitRun1);

    for (const frame of frames) {
      expect(isOneBit(frame)).toBe(true);
      expect(spriteSize(frame)).toEqual(size);
      expect(frame.some((row) => row.includes(1))).toBe(true);
    }

    expect(rabbitHitboxSize()).toEqual(size);
    expect(RABBIT_SPRITE).toBe(rabbitRun1);
  });

  it("draws the jump frame in the air and alternates run frames on the ground", () => {
    expect(selectRabbitSprite(false, 0)).toBe(rabbitJump);
    expect(selectRabbitSprite(true, 0)).toBe(rabbitRun1);
    expect(selectRabbitSprite(true, RABBIT_RUN_FRAME_MS)).toBe(rabbitRun2);
    expect(selectRabbitSprite(true, RABBIT_RUN_FRAME_MS * 2)).toBe(rabbitRun1);
  });

  it("draws only lit pixels with fillRect", () => {
    const fillRect = vi.fn();
    const ctx = { fillRect } as unknown as CanvasRenderingContext2D;

    drawSprite(ctx, [[1, 0], [0, 1]], 10, 20);

    expect(fillRect).toHaveBeenCalledTimes(2);
    expect(fillRect).toHaveBeenCalledWith(10, 20, PIXEL_SIZE, PIXEL_SIZE);
    expect(fillRect).toHaveBeenCalledWith(10 + PIXEL_SIZE, 20 + PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
  });

  it("sizes the cactus sprite for obstacle collision boxes", () => {
    const size = spriteSize(CACTUS_SPRITE);
    expect(size.width).toBe(CACTUS_SPRITE[0].length * PIXEL_SIZE);
    expect(size.height).toBe(CACTUS_SPRITE.length * PIXEL_SIZE);
  });
});


describe("pixel sprites", () => {
  it("defines the rabbit as a 1-bit pixel matrix", () => {
    expect(RABBIT_SPRITE.length).toBeGreaterThan(8);
    expect(RABBIT_SPRITE.every((row) => row.every((cell) => cell === 0 || cell === 1))).toBe(
      true,
    );
    expect(RABBIT_SPRITE.some((row) => row.includes(1))).toBe(true);
  });

  it("draws only lit pixels with fillRect", () => {
    const fillRect = vi.fn();
    const ctx = { fillRect } as unknown as CanvasRenderingContext2D;

    drawSprite(ctx, [[1, 0], [0, 1]], 10, 20);

    expect(fillRect).toHaveBeenCalledTimes(2);
    expect(fillRect).toHaveBeenCalledWith(10, 20, PIXEL_SIZE, PIXEL_SIZE);
    expect(fillRect).toHaveBeenCalledWith(10 + PIXEL_SIZE, 20 + PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
  });

  it("sizes the cactus sprite for obstacle collision boxes", () => {
    const size = spriteSize(CACTUS_SPRITE);
    expect(size.width).toBe(CACTUS_SPRITE[0].length * PIXEL_SIZE);
    expect(size.height).toBe(CACTUS_SPRITE.length * PIXEL_SIZE);
  });
});
