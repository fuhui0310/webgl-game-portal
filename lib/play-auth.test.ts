import { sign } from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const JWT_SECRET = "test-play-secret";

describe("extractPlayToken", () => {
  it("returns a string token from search params", async () => {
    const { extractPlayToken } = await import("./play-auth");
    expect(extractPlayToken("abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("uses the first value when search params provide an array", async () => {
    const { extractPlayToken } = await import("./play-auth");
    expect(extractPlayToken(["first-token", "second-token"])).toBe("first-token");
  });

  it("returns null when the token is missing or empty", async () => {
    const { extractPlayToken } = await import("./play-auth");
    expect(extractPlayToken(undefined)).toBeNull();
    expect(extractPlayToken("")).toBeNull();
    expect(extractPlayToken([])).toBeNull();
  });
});

describe("verifyPlayToken", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("JWT_SECRET", JWT_SECRET);
  });

  it("accepts a valid JWT signed with JWT_SECRET", async () => {
    const token = sign({ sub: "player-1" }, JWT_SECRET, { expiresIn: "15m" });
    const { verifyPlayToken } = await import("./play-auth");

    expect(verifyPlayToken(token)).toBe(true);
  });

  it("rejects an expired JWT", async () => {
    const token = sign({ sub: "player-1" }, JWT_SECRET, { expiresIn: -10 });
    const { verifyPlayToken } = await import("./play-auth");

    expect(verifyPlayToken(token)).toBe(false);
  });

  it("rejects a JWT signed with a different secret", async () => {
    const token = sign({ sub: "player-1" }, "wrong-secret", { expiresIn: "15m" });
    const { verifyPlayToken } = await import("./play-auth");

    expect(verifyPlayToken(token)).toBe(false);
  });

  it("rejects malformed tokens", async () => {
    const { verifyPlayToken } = await import("./play-auth");
    expect(verifyPlayToken("not-a-jwt")).toBe(false);
  });

  it("throws when JWT_SECRET is missing", async () => {
    vi.stubEnv("JWT_SECRET", "");
    const { verifyPlayToken } = await import("./play-auth");

    expect(() => verifyPlayToken("abc")).toThrow(/JWT_SECRET/);
  });
});
