/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(() => {
  cleanup();
});

describe("Home arcade page", () => {
  it("renders the retro title, score, and a game canvas", () => {
    render(<Home />);

    expect(screen.getByText("MEDMIND TECH")).toBeTruthy();
    expect(screen.getByText(/SCORE/)).toBeTruthy();
    expect(document.querySelector("canvas")).toBeInstanceOf(HTMLCanvasElement);
  });
});
