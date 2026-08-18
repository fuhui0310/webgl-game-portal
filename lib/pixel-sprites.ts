export type Pixel = 0 | 1;
export type PixelMatrix = Pixel[][];

export const PIXEL_SIZE = 2;
export const INK = "#FFFFFF";
export const RABBIT_RUN_FRAME_MS = 120;

export const rabbitRun1: PixelMatrix = [
  [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
];

export const rabbitRun2: PixelMatrix = [
  [0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0],
  [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
];

export const rabbitJump: PixelMatrix = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
];

export const RABBIT_SPRITE = rabbitRun1;

export const CACTUS_SPRITE: PixelMatrix = [
  [0, 0, 1, 1, 0, 1, 0],
  [0, 0, 1, 1, 1, 1, 0],
  [1, 0, 1, 1, 0, 1, 0],
  [1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0],
];

export const BRICK_SPRITE: PixelMatrix = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

export function spriteSize(matrix: PixelMatrix): { width: number; height: number } {
  const columns = matrix[0]?.length ?? 0;
  return {
    width: columns * PIXEL_SIZE,
    height: matrix.length * PIXEL_SIZE,
  };
}

export function rabbitHitboxSize(): { width: number; height: number } {
  return spriteSize(rabbitRun1);
}

export function selectRabbitSprite(
  grounded: boolean,
  elapsedMs: number,
): PixelMatrix {
  if (!grounded) {
    return rabbitJump;
  }

  const frame = Math.floor(elapsedMs / RABBIT_RUN_FRAME_MS) % 2;
  return frame === 0 ? rabbitRun1 : rabbitRun2;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  matrix: PixelMatrix,
  originX: number,
  originY: number,
  pixelSize: number = PIXEL_SIZE,
): void {
  ctx.fillStyle = INK;
  for (let row = 0; row < matrix.length; row += 1) {
    const line = matrix[row];
    for (let col = 0; col < line.length; col += 1) {
      if (line[col] === 1) {
        ctx.fillRect(
          originX + col * pixelSize,
          originY + row * pixelSize,
          pixelSize,
          pixelSize,
        );
      }
    }
  }
}
