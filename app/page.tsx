"use client";

import {
  createArcadeState,
  displayScore,
  jump,
  tick,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type ArcadeState,
} from "../lib/arcade-runner";
import {
  BRICK_SPRITE,
  CACTUS_SPRITE,
  INK,
  RABBIT_SPRITE,
  drawSprite,
} from "../lib/pixel-sprites";
import { useCallback, useEffect, useRef, useState } from "react";

function fitCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawScene(ctx: CanvasRenderingContext2D, state: ArcadeState) {
  const { canvas } = ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(
    canvas.width / WORLD_WIDTH,
    canvas.height / WORLD_HEIGHT,
  );
  const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2;
  const offsetY = (canvas.height - WORLD_HEIGHT * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = INK;
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 89) % WORLD_WIDTH;
    const y = (i * 37) % (state.groundY - 24);
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.fillRect(0, state.groundY, WORLD_WIDTH, 2);
  for (let x = 0; x < WORLD_WIDTH; x += 12) {
    ctx.fillRect(x, state.groundY + 8, 6, 2);
  }

  for (const obstacle of state.obstacles) {
    drawSprite(
      ctx,
      obstacle.kind === "brick" ? BRICK_SPRITE : CACTUS_SPRITE,
      obstacle.x,
      obstacle.y,
    );
  }

  drawSprite(ctx, RABBIT_SPRITE, state.player.x, state.player.y);
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(createArcadeState());
  const [hud, setHud] = useState({
    status: stateRef.current.status,
    score: stateRef.current.score,
  });

  const syncHud = useCallback((state: ArcadeState) => {
    setHud((current) => {
      const nextScore = Math.floor(state.score);
      const currentScore = Math.floor(current.score);
      if (current.status === state.status && currentScore === nextScore) {
        return current;
      }
      return { status: state.status, score: state.score };
    });
  }, []);

  const triggerJump = useCallback(() => {
    stateRef.current = jump(stateRef.current);
    syncHud(stateRef.current);
  }, [syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    let frameId = 0;
    let lastTime = performance.now();
    let alive = true;

    const loop = (now: number) => {
      if (!alive || !ctx) {
        return;
      }

      fitCanvas(canvas);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      stateRef.current = tick(stateRef.current, dt);
      drawScene(ctx, stateRef.current);
      syncHud(stateRef.current);
      frameId = window.requestAnimationFrame(loop);
    };

    const onResize = () => fitCanvas(canvas);
    window.addEventListener("resize", onResize);
    fitCanvas(canvas);
    if (ctx) {
      drawScene(ctx, stateRef.current);
    }
    frameId = window.requestAnimationFrame(loop);

    return () => {
      alive = false;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, [syncHud]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      triggerJump();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [triggerJump]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-black px-4 py-8 text-white sm:py-12">
      <p className="font-mono text-[10px] tracking-[0.55em] text-white sm:text-xs">
        INSERT COIN
      </p>
      <h1 className="mt-3 text-center font-mono text-2xl font-bold tracking-[0.22em] text-white sm:text-4xl sm:tracking-[0.35em]">
        MEDMIND TECH
      </h1>
      <p className="mt-3 max-w-md text-center font-mono text-[11px] leading-5 text-white sm:text-xs">
        空白鍵或點擊畫面，讓兔子跳起來
      </p>

      <section className="relative mt-8 w-full max-w-4xl">
        <div
          className="absolute right-3 top-3 z-10 font-mono text-xs tracking-widest text-white sm:right-5 sm:top-5 sm:text-sm"
          aria-live="polite"
        >
          SCORE {displayScore(hud.score)}
        </div>

        <button
          type="button"
          aria-label="像素兔子奔跑遊戲，按下空白鍵或點擊以跳躍"
          onClick={triggerJump}
          className="block w-full rounded-none border-2 border-white bg-black"
        >
          <div className="relative aspect-[16/10] min-h-[200px] w-full sm:aspect-[2/1] sm:min-h-[280px]">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_2px,rgba(255,255,255,0.04)_2px,rgba(255,255,255,0.04)_4px)]" />
            {hud.status === "ready" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.35em] text-white sm:text-sm">
                  PRESS SPACE TO START
                </p>
              </div>
            ) : null}
            {hud.status === "gameover" ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-4 text-center">
                <p className="font-mono text-xl tracking-[0.3em] text-white sm:text-3xl">
                  GAME OVER
                </p>
                <p className="mt-3 font-mono text-sm tracking-widest text-white">
                  SCORE {displayScore(hud.score)}
                </p>
                <p className="mt-5 font-mono text-[10px] tracking-[0.28em] text-white sm:text-xs">
                  PRESS SPACE TO RESTART
                </p>
              </div>
            ) : null}
          </div>
        </button>
      </section>
    </main>
  );
}
