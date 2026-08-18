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
  AWS_REGION: "ap-northeast-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
  S3_GAME_BUCKET: "private-game-bucket",
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
    vi.stubEnv("S3_GAME_BUCKET", "");
    const { generateGamePresignedUrl } = await import("./s3-game");

    await expect(
      generateGamePresignedUrl("Build/Game.loader.js"),
    ).rejects.toThrow(/S3_GAME_BUCKET/);
  });

  it("issues a GET presigned URL that expires in 900 seconds", async () => {
    getSignedUrlMock.mockResolvedValue(
      "https://private-game-bucket.s3.amazonaws.com/Build/Game.wasm?X-Amz-Expires=900",
    );

    const { generateGamePresignedUrl } = await import("./s3-game");
    const url = await generateGamePresignedUrl("Build/Game.wasm");

    expect(s3ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "ap-northeast-1",
        credentials: {
          accessKeyId: "test-access-key",
          secretAccessKey: "test-secret-key",
        },
      }),
    );
    expect(getObjectCommandMock).toHaveBeenCalledWith({
      Bucket: "private-game-bucket",
      Key: "Build/Game.wasm",
    });
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: {
          Bucket: "private-game-bucket",
          Key: "Build/Game.wasm",
        },
      }),
      { expiresIn: 900 },
    );
    expect(url).toContain("Build/Game.wasm");
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
      loaderKey: "Build/MyGame.loader.js",
      dataKey: "Build/MyGame.data",
      frameworkKey: "Build/MyGame.framework.js",
      codeKey: "Build/MyGame.wasm",
    });
  });
});
