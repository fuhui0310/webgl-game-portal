import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const PRESIGNED_URL_EXPIRES_IN_SECONDS = 900;

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

  const client = new S3Client({
    region: getRequiredEnv("MM_AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("MM_AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("MM_AWS_SECRET_ACCESS_KEY"),
    },
  });

  const command = new GetObjectCommand({
    Bucket: getRequiredEnv("S3_GAME_BUCKET"),
    Key: objectKey,
    ResponseContentType: contentType,
    ResponseContentEncoding: contentEncoding,
  });

  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  });
}
