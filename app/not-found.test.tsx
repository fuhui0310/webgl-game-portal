/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: function Link({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  },
}));

afterEach(() => {
  cleanup();
});

describe("NotFound page", () => {
  it("explains the missing page and links back to the arcade", async () => {
    const NotFound = (await import("./not-found")).default;
    render(<NotFound />);

    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByText("找不到頁面")).toBeTruthy();
    expect(
      screen.getByText("這裡什麼都沒有，但首頁有一隻兔子。"),
    ).toBeTruthy();

    const heading = screen.getByText("404");
    expect(heading.className).toMatch(/glitch/);

    const homeLink = screen.getByRole("link", { name: /回首頁找兔子/ });
    expect(homeLink.getAttribute("href")).toBe("/");
  });
});
