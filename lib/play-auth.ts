import { verify } from "jsonwebtoken";

export type SearchParamValue = string | string[] | undefined;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function extractPlayToken(token: SearchParamValue): string | null {
  if (typeof token === "string" && token.length > 0) {
    return token;
  }

  if (Array.isArray(token) && typeof token[0] === "string" && token[0].length > 0) {
    return token[0];
  }

  return null;
}

export function verifyPlayToken(token: string): boolean {
  const secret = getRequiredEnv("JWT_SECRET");

  try {
    verify(token, secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
