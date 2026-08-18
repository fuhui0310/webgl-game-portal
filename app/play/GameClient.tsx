"use client";

import Script from "next/script";
import { useCallback, useRef, useState, useEffect } from "react";

export type GameClientProps = {
  loaderUrl: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
};

export type UnityConfig = {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  matchWebGLToCanvasSize: boolean;
};

export type UnityInstance = {
  Quit: () => Promise<void>;
};

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      onProgress?: (progress: number) => void,
    ) => Promise<UnityInstance>;
  }
}

type LoadStatus = "loading" | "ready" | "error";

export function GameClient({
  loaderUrl,
  dataUrl,
  frameworkUrl,
  codeUrl,
}: GameClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoaderReady = useCallback(() => {
    if (startedRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      setStatus("error");
      setErrorMessage("無法初始化遊戲畫布");
      return;
    }

    if (typeof window.createUnityInstance !== "function") {
      setStatus("error");
      setErrorMessage("Unity Loader 載入失敗");
      return;
    }

    startedRef.current = true;

    const config: UnityConfig = {
      dataUrl,
      frameworkUrl,
      codeUrl,
      matchWebGLToCanvasSize: true,
    };

    void window
      .createUnityInstance(canvas, config, (nextProgress) => {
        setProgress(nextProgress);
      })
      .then(() => {
        setStatus("ready");
      })
      .catch(() => {
        startedRef.current = false;
        setStatus("error");
        setErrorMessage("遊戲啟動失敗");
      });
  }, [codeUrl, dataUrl, frameworkUrl]);

  const handleLoaderError = useCallback(() => {
    setStatus("error");
    setErrorMessage("Unity Loader 載入失敗");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("token")) {
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.toString());
      }
    }
  }, []);

  return (
    <main className="relative flex h-screen w-full flex-col bg-black">
      <div className="relative h-full min-h-0 w-full flex-1">
        <canvas
          ref={canvasRef}
          id="unity-canvas"
          className="block h-full w-full object-contain outline-none"
          style={{ width: "100%", height: "100%" }}
          tabIndex={-1}
        />
      </div>
      <Script
        id="unity-loader"
        src={loaderUrl}
        strategy="afterInteractive"
        onLoad={handleLoaderReady}
        onError={handleLoaderError}
      />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-zinc-100">
          <p className="text-lg font-medium tracking-wide">
            載入中 {Math.round(progress * 100)}%
          </p>
          <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
      {status === "error" && errorMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 px-6 text-center">
          <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 text-zinc-100">
            <h1 className="text-2xl font-semibold tracking-tight">
              {errorMessage}
            </h1>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              請重新整理頁面，或向管理員索取新的遊戲連結。
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
