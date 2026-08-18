import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const PRESIGNED_URL_EXPIRES_IN_SECONDS = 60;

function getRequiredEnv(name: string): string {
  const value = process.env[name] ?? process.env[`MM_${name}`];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isSafePath(segments: string[]): boolean {
  return (
    segments.length > 0 &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        !segment.includes("\\"),
    )
  );
}

function isS3NotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    maybeError.name === "NoSuchKey" ||
    maybeError.name === "NotFound" ||
    maybeError.$metadata?.httpStatusCode === 404
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (!isSafePath(path)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const objectKey = `webgl/StreamingAssets/${path.join("/")}`;
  const client = new S3Client({
    region: getRequiredEnv("AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

  try {
    const command = new GetObjectCommand({
      Bucket: getRequiredEnv("S3_GAME_BUCKET"),
      Key: objectKey,
    });
    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    });

    return NextResponse.redirect(presignedUrl, 307);
  } catch (error) {
    if (isS3NotFound(error)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
