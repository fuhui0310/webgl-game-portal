import { describe, expect, it, vi } from "vitest";
import {
  CACTUS_SPRITE,
  PIXEL_SIZE,
  RABBIT_SPRITE,
  drawSprite,
  spriteSize,
} from "./pixel-sprites";

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
