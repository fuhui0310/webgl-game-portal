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

  const objectPrefix = `Build/${prefix}`;
  return {
    loaderKey: `${objectPrefix}.loader.js`,
    dataKey: `${objectPrefix}.data`,
    frameworkKey: `${objectPrefix}.framework.js`,
    codeKey: `${objectPrefix}.wasm`,
  };
}

export async function generateGamePresignedUrl(
  objectKey: string,
): Promise<string> {
  if (!objectKey) {
    throw new Error("objectKey is required");
  }

  const client = new S3Client({
    region: getRequiredEnv("AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

  const command = new GetObjectCommand({
    Bucket: getRequiredEnv("S3_GAME_BUCKET"),
    Key: objectKey,
  });

  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
  });
}
