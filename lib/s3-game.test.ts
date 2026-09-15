import { beforeEach, describe, expect, it, vi } from "vitest";

const getSignedUrlMock = vi.fn();
const s3ClientMock = vi.fn();
const getObjectCommandMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    constructor(config: unknown) {
      s3ClientMock(config);
    }
  },
  GetObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
      getObjectCommandMock(input);
    }
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

const REQUIRED_ENV = {
  MM_AWS_REGION: "ap-northeast-1",
  MM_AWS_ACCESS_KEY_ID: "test-access-key",
  MM_AWS_SECRET_ACCESS_KEY: "test-secret-key",
  MM_S3_GAME_BUCKET: "private-game-bucket",
};

describe("generateGamePresignedUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    getSignedUrlMock.mockReset();
    s3ClientMock.mockReset();
    getObjectCommandMock.mockReset();
    vi.unstubAllEnvs();

    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  it("throws when a required environment variable is missing", async () => {
    vi.stubEnv("MM_S3_GAME_BUCKET", "");
    const { generateGamePresignedUrl } = await import("./s3-game");

    await expect(
      generateGamePresignedUrl("Build/Game.loader.js"),
    ).rejects.toThrow(/MM_S3_GAME_BUCKET/);
  });

  it("issues a cacheable GET presigned URL with a stable signing window", async () => {
    getSignedUrlMock.mockResolvedValue(
      "https://private-game-bucket.s3.amazonaws.com/Build/Game.wasm?X-Amz-Expires=25200",
    );

    const { GAME_ASSET_CACHE_CONTROL, generateGamePresignedUrl, getPresignedSigningOptions } =
      await import("./s3-game");
    const now = Date.parse("2026-09-15T10:20:00.000Z");
    const url = await generateGamePresignedUrl("Build/Game.wasm", now);

    expect(getObjectCommandMock).toHaveBeenCalledWith({
      Bucket: "private-game-bucket",
      Key: "Build/Game.wasm",
      ResponseContentType: "application/octet-stream",
      ResponseContentEncoding: undefined,
      ResponseCacheControl: GAME_ASSET_CACHE_CONTROL,
    });
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      getPresignedSigningOptions(now),
    );
    expect(url).toContain("Build/Game.wasm");
  });

  it("reuses the same signingDate inside a 6-hour bucket", async () => {
    const { getPresignedSigningOptions } = await import("./s3-game");
    const morning = getPresignedSigningOptions(Date.parse("2026-09-15T01:10:00.000Z"));
    const later = getPresignedSigningOptions(Date.parse("2026-09-15T05:50:00.000Z"));

    expect(morning.signingDate).toEqual(later.signingDate);
    expect(morning.expiresIn).toBe(7 * 60 * 60);
  });

  it("throws when objectKey is empty", async () => {
    const { generateGamePresignedUrl } = await import("./s3-game");

    await expect(generateGamePresignedUrl("")).rejects.toThrow(/objectKey/);
  });
});

describe("getGameBuildObjectKeys", () => {
  it("maps a Unity WebGL prefix to the four Build object keys", async () => {
    const { getGameBuildObjectKeys } = await import("./s3-game");

    expect(getGameBuildObjectKeys("MyGame")).toEqual({
      loaderKey: "webgl/Build/MyGame.loader.js",
      dataKey: "webgl/Build/MyGame.data.gz",
      frameworkKey: "webgl/Build/MyGame.framework.js.gz",
      codeKey: "webgl/Build/MyGame.wasm.gz",
    });
  });
});
