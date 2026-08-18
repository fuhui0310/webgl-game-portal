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
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(
    canvas.width / WORLD_WIDTH,
    canvas.height / WORLD_HEIGHT,
  );
  const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2;
  const offsetY = (canvas.height - WORLD_HEIGHT * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.fillStyle = "#d4d4d8";
  for (let i = 0; i < 28; i += 1) {
    const x = (i * 97) % WORLD_WIDTH;
    const y = (i * 53) % (state.groundY - 28);
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#27272a";
  ctx.fillRect(0, state.groundY, WORLD_WIDTH, WORLD_HEIGHT - state.groundY);
  ctx.fillStyle = "#a3e635";
  ctx.fillRect(0, state.groundY, WORLD_WIDTH, 3);

  for (let x = 0; x < WORLD_WIDTH; x += 16) {
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(x, state.groundY + 8, 10, 3);
  }

  ctx.fillStyle = "#e879f9";
  for (const obstacle of state.obstacles) {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillRect(obstacle.x - 5, obstacle.y + 8, 6, 5);
    ctx.fillRect(obstacle.x + obstacle.width - 1, obstacle.y + 14, 6, 5);
  }

  const { player } = state;
  ctx.fillStyle = "#67e8f9";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#164e63";
  ctx.fillRect(player.x + 14, player.y + 6, 4, 4);
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
    <main className="flex min-h-full flex-1 flex-col items-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-12">
      <p className="font-mono text-[10px] tracking-[0.55em] text-lime-300 sm:text-xs">
        INSERT COIN
      </p>
      <h1 className="mt-3 text-center font-mono text-2xl font-bold tracking-[0.22em] text-lime-400 sm:text-4xl sm:tracking-[0.35em]">
        NEUROGYM ARCADE
      </h1>
      <p className="mt-3 max-w-md text-center font-mono text-[11px] leading-5 text-zinc-500 sm:text-xs">
        空白鍵或點擊畫面跳躍 · 避開障礙物
      </p>

      <section className="relative mt-8 w-full max-w-4xl">
        <div
          className="absolute right-3 top-3 z-10 font-mono text-xs tracking-widest text-lime-300 sm:right-5 sm:top-5 sm:text-sm"
          aria-live="polite"
        >
          SCORE {displayScore(hud.score)}
        </div>

        <button
          type="button"
          aria-label="街機奔跑遊戲，按下空白鍵或點擊以跳躍"
          onClick={triggerJump}
          className="block w-full rounded-sm border-4 border-lime-500 bg-black shadow-[0_0_28px_rgba(163,230,53,0.25)]"
        >
          <div className="relative aspect-[16/10] min-h-[200px] w-full sm:aspect-[2/1] sm:min-h-[280px]">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
            />
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_2px,rgba(0,0,0,0.18)_2px,rgba(0,0,0,0.18)_4px)]" />
            {hud.status === "ready" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-[10px] tracking-[0.35em] text-lime-200 sm:text-sm">
                  PRESS SPACE TO START
                </p>
              </div>
            ) : null}
            {hud.status === "gameover" ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-4 text-center">
                <p className="font-mono text-xl tracking-[0.3em] text-fuchsia-400 sm:text-3xl">
                  GAME OVER
                </p>
                <p className="mt-3 font-mono text-sm tracking-widest text-lime-300">
                  SCORE {displayScore(hud.score)}
                </p>
                <p className="mt-5 font-mono text-[10px] tracking-[0.28em] text-zinc-200 sm:text-xs">
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
