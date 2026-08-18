"use client";

export type GameClientProps = {
  loaderUrl: string;
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
};

export function GameClient(_props: GameClientProps) {
  return <canvas id="unity-canvas" />;
}
