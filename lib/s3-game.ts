import { createHash } from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const PRESIGNED_URL_EXPIRES_IN_SECONDS = 7 * 60 * 60;
export const PRESIGNED_SIGNING_BUCKET_MS = 6 * 60 * 60 * 1000;
export const GAME_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function getPresignedSigningOptions(now = Date.now()): {
  expiresIn: number;
  signingDate: Date;
} {
  return {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    signingDate: new Date(
      Math.floor(now / PRESIGNED_SIGNING_BUCKET_MS) * PRESIGNED_SIGNING_BUCKET_MS,
    ),
  };
}

export type GameBuildObjectKeys = {
  loaderKey: string;
  dataKey: string;
  frameworkKey: string;
  codeKey: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createGameS3Client(): S3Client {
  return new S3Client({
    region: getRequiredEnv("MM_AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("MM_AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("MM_AWS_SECRET_ACCESS_KEY"),
    },
  });
}

export function getGameBuildObjectKeys(prefix: string): GameBuildObjectKeys {
  if (!prefix) {
    throw new Error("Game build prefix is required");
  }

  const objectPrefix = `webgl/Build/${prefix}`;
  return {
    loaderKey: `${objectPrefix}.loader.js`,
    dataKey: `${objectPrefix}.data.gz`,
    frameworkKey: `${objectPrefix}.framework.js.gz`,
    codeKey: `${objectPrefix}.wasm.gz`,
  };
}

export async function generateGamePresignedUrl(
  objectKey: string,
  now = Date.now(),
): Promise<string> {
  if (!objectKey) {
    throw new Error("objectKey is required");
  }

  let contentType = "application/octet-stream";
  let contentEncoding = undefined;

  if (objectKey.endsWith(".loader.js")) {
    contentType = "application/javascript";
  } else if (objectKey.endsWith(".framework.js.gz")) {
    contentType = "application/javascript";
    contentEncoding = "gzip";
  } else if (objectKey.endsWith(".wasm.gz")) {
    contentType = "application/wasm";
    contentEncoding = "gzip";
  } else if (objectKey.endsWith(".data.gz")) {
    contentType = "application/octet-stream";
    contentEncoding = "gzip";
  }

  const client = createGameS3Client();

  const command = new GetObjectCommand({
    Bucket: getRequiredEnv("MM_S3_GAME_BUCKET"),
    Key: objectKey,
    ResponseContentType: contentType,
    ResponseContentEncoding: contentEncoding,
    ResponseCacheControl: GAME_ASSET_CACHE_CONTROL,
  });

  return getSignedUrl(client, command, getPresignedSigningOptions(now));
}

export async function getGameAssetVersion(
  keys: GameBuildObjectKeys,
): Promise<string> {
  const client = createGameS3Client();
  const bucket = getRequiredEnv("MM_S3_GAME_BUCKET");
  const objectKeys = [
    keys.loaderKey,
    keys.dataKey,
    keys.frameworkKey,
    keys.codeKey,
  ];
  const etags = await Promise.all(
    objectKeys.map(async (Key) => {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key,
          Range: "bytes=0-0",
        }),
      );
      if (result.Body && "transformToByteArray" in result.Body) {
        await result.Body.transformToByteArray();
      }
      return result.ETag ?? "";
    }),
  );
  const extra = process.env.MM_S3_GAME_CACHE_VERSION ?? "";

  return createHash("sha256")
    .update([...etags, extra].join("|"))
    .digest("hex")
    .slice(0, 16);
}
