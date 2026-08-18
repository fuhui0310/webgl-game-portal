/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  const originalRequestFullscreen = HTMLElement.prototype.requestFullscreen;

  beforeEach(() => {
    createUnityInstance.mockReset();
    createUnityInstance.mockResolvedValue({ Quit: vi.fn() });
    window.createUnityInstance = createUnityInstance;
  });

  afterEach(() => {
    cleanup();
    delete window.createUnityInstance;
    HTMLElement.prototype.requestFullscreen = originalRequestFullscreen;
  });

  it("renders the Unity canvas and a loading hint", async () => {
    const { GameClient } = await import("./GameClient");
    render(<GameClient {...urls} />);

    expect(document.getElementById("unity-canvas")).toBeInstanceOf(
      HTMLCanvasElement,
    );
    const canvas = document.getElementById("unity-canvas");
    expect(canvas?.className).toMatch(/w-full/);
    expect(canvas?.className).toMatch(/h-full/);
    expect(canvas?.style.width).toBe("100%");
    expect(canvas?.style.height).toBe("100%");
    expect(canvas?.parentElement?.className).toMatch(/h-full|h-screen|flex/);
    expect(screen.getByText(/載入中/)).toBeTruthy();
    expect(
      document.querySelector('[data-testid="unity-loader-script"]'),
    ).toHaveProperty("src", urls.loaderUrl);
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
        matchWebGLToCanvasSize: true,
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

  it("requests fullscreen on the canvas wrapper from the corner button", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    HTMLElement.prototype.requestFullscreen = requestFullscreen;

    const { GameClient } = await import("./GameClient");
    render(<GameClient {...urls} />);

    const canvas = document.getElementById("unity-canvas");
    expect(canvas?.parentElement?.className).toMatch(/relative/);

    const button = screen.getByRole("button", { name: /全螢幕/ });
    expect(button.className).toMatch(/absolute/);
    expect(button.className).toMatch(/bottom-4/);
    expect(button.className).toMatch(/left-4/);

    fireEvent.click(button);

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(requestFullscreen.mock.instances[0]).toBe(canvas?.parentElement);
  });
});
