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

describe("GET /StreamingAssets/[...path]", () => {
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

  it("redirects to a 60-second S3 presigned URL", async () => {
    getSignedUrlMock.mockResolvedValue(
      "https://private-game-bucket.s3.amazonaws.com/webgl/StreamingAssets/aa/bb.bundle?X-Amz-Expires=60",
    );

    const { GET } = await import("./[...path]/route");
    const response = await GET(
      new Request("http://localhost/StreamingAssets/aa/bb.bundle"),
      { params: Promise.resolve({ path: ["aa", "bb.bundle"] }) },
    );

    expect(getObjectCommandMock).toHaveBeenCalledWith({
      Bucket: "private-game-bucket",
      Key: "webgl/StreamingAssets/aa/bb.bundle",
    });
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: {
          Bucket: "private-game-bucket",
          Key: "webgl/StreamingAssets/aa/bb.bundle",
        },
      }),
      { expiresIn: 60 },
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "webgl/StreamingAssets/aa/bb.bundle",
    );
  });

  it("returns 404 for an unsafe path", async () => {
    const { GET } = await import("./[...path]/route");
    const response = await GET(
      new Request("http://localhost/StreamingAssets/../secret"),
      { params: Promise.resolve({ path: ["..", "secret"] }) },
    );

    expect(response.status).toBe(404);
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("returns 404 when S3 signing fails as not found", async () => {
    getSignedUrlMock.mockRejectedValue(
      Object.assign(new Error("missing"), {
        name: "NoSuchKey",
        $metadata: { httpStatusCode: 404 },
      }),
    );

    const { GET } = await import("./[...path]/route");
    const response = await GET(
      new Request("http://localhost/StreamingAssets/missing.bundle"),
      { params: Promise.resolve({ path: ["missing.bundle"] }) },
    );

    expect(response.status).toBe(404);
  });

  it("returns 500 when signing the URL fails", async () => {
    getSignedUrlMock.mockRejectedValue(new Error("kms unavailable"));

    const { GET } = await import("./[...path]/route");
    const response = await GET(
      new Request("http://localhost/StreamingAssets/aa/bb.bundle"),
      { params: Promise.resolve({ path: ["aa", "bb.bundle"] }) },
    );

    expect(response.status).toBe(500);
  });
});
