/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/script", () => ({
  default: function Script({
    src,
    onLoad,
    onError,
  }: {
    src: string;
    onLoad?: () => void;
    onError?: () => void;
  }) {
    useEffect(() => {
      if (src.includes("fail-loader")) {
        onError?.();
        return;
      }
      onLoad?.();
    }, [onError, onLoad, src]);

    return <script async data-testid="unity-loader-script" src={src} />;
  },
}));

const urls = {
  loaderUrl: "https://s3.example/Build/MyGame.loader.js?X-Amz-Signature=abc",
  dataUrl: "https://s3.example/Build/MyGame.data?X-Amz-Signature=def",
  frameworkUrl:
    "https://s3.example/Build/MyGame.framework.js?X-Amz-Signature=ghi",
  codeUrl: "https://s3.example/Build/MyGame.wasm?X-Amz-Signature=jkl",
};

describe("GameClient", () => {
  const createUnityInstance = vi.fn();

  beforeEach(() => {
    createUnityInstance.mockReset();
    createUnityInstance.mockResolvedValue({ Quit: vi.fn() });
    window.createUnityInstance = createUnityInstance;
  });

  afterEach(() => {
    cleanup();
    delete window.createUnityInstance;
  });

  it("renders the Unity canvas and a loading hint", async () => {
    const { GameClient } = await import("./GameClient");
    render(<GameClient {...urls} />);

    expect(document.getElementById("unity-canvas")).toBeInstanceOf(
      HTMLCanvasElement,
    );
    expect(screen.getByText(/載入中/)).toBeTruthy();
    expect(screen.getByTestId("unity-loader-script")).toHaveProperty(
      "src",
      urls.loaderUrl,
    );
  });

  it("starts Unity with the presigned build URLs after the loader script loads", async () => {
    const { GameClient } = await import("./GameClient");
    render(<GameClient {...urls} />);

    await waitFor(() => {
      expect(createUnityInstance).toHaveBeenCalledTimes(1);
    });

    const canvas = document.getElementById("unity-canvas");
    expect(createUnityInstance).toHaveBeenCalledWith(
      canvas,
      {
        dataUrl: urls.dataUrl,
        frameworkUrl: urls.frameworkUrl,
        codeUrl: urls.codeUrl,
      },
      expect.any(Function),
    );
  });

  it("shows an error when the Unity loader script fails", async () => {
    const { GameClient } = await import("./GameClient");
    render(
      <GameClient
        {...urls}
        loaderUrl="https://s3.example/Build/fail-loader.js"
      />,
    );

    expect(await screen.findByText(/Unity Loader 載入失敗/)).toBeTruthy();
    expect(createUnityInstance).not.toHaveBeenCalled();
  });

  it("shows an error when createUnityInstance rejects", async () => {
    createUnityInstance.mockRejectedValue(new Error("boot failed"));
    const { GameClient } = await import("./GameClient");
    render(<GameClient {...urls} />);

    expect(await screen.findByText(/遊戲啟動失敗/)).toBeTruthy();
  });
});
