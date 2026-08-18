import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const s3ClientMock = vi.fn();
const getObjectCommandMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    constructor(config: unknown) {
      s3ClientMock(config);
    }
    send = sendMock;
  },
  GetObjectCommand: class {
    constructor(input: unknown) {
      getObjectCommandMock(input);
    }
  },
}));

const REQUIRED_ENV = {
  AWS_REGION: "ap-northeast-1",
  AWS_ACCESS_KEY_ID: "test-access-key",
  AWS_SECRET_ACCESS_KEY: "test-secret-key",
  S3_GAME_BUCKET: "private-game-bucket",
};

function streamFrom(text: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe("GET /StreamingAssets/[...path]", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    s3ClientMock.mockReset();
    getObjectCommandMock.mockReset();
    vi.unstubAllEnvs();

    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  it("streams the S3 object for a nested StreamingAssets key", async () => {
    const body = streamFrom("catalog");
    sendMock.mockResolvedValue({
      Body: { transformToWebStream: () => body },
      ContentType: "application/json",
    });

    const { GET } = await import("./[...path]/route");
    const response = await GET(new Request("http://localhost/StreamingAssets/aa/bb.json"), {
      params: Promise.resolve({ path: ["aa", "bb.json"] }),
    });

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
      Key: "webgl/StreamingAssets/aa/bb.json",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    await expect(response.text()).resolves.toBe("catalog");
  });

  it("defaults Content-Type to application/octet-stream", async () => {
    sendMock.mockResolvedValue({
      Body: { transformToWebStream: () => streamFrom("bin") },
    });

    const { GET } = await import("./[...path]/route");
    const response = await GET(new Request("http://localhost/StreamingAssets/data.bin"), {
      params: Promise.resolve({ path: ["data.bin"] }),
    });

    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("returns 404 when S3 does not have the object", async () => {
    sendMock.mockRejectedValue(
      Object.assign(new Error("missing"), {
        name: "NoSuchKey",
        $metadata: { httpStatusCode: 404 },
      }),
    );

    const { GET } = await import("./[...path]/route");
    const response = await GET(new Request("http://localhost/StreamingAssets/missing.json"), {
      params: Promise.resolve({ path: ["missing.json"] }),
    });

    expect(response.status).toBe(404);
  });
});
