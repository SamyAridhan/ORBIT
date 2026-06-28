import React from "react";
import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PhoneFrame from "./components/PhoneFrame";

afterEach(cleanup);

describe("real PWA shell", () => {
  it("renders application content without mock phone status chrome", () => {
    const {container}=render(<PhoneFrame><div>ORBIT content</div></PhoneFrame>);
    expect(screen.getByText("ORBIT content")).toBeInTheDocument();
    expect(screen.queryByText("9:41")).not.toBeInTheDocument();
    expect(container.firstChild).not.toHaveClass("sm:h-[844px]","sm:w-[390px]","sm:border-[8px]");
  });

  it("provides standalone manifest metadata and install icons", () => {
    const manifest=JSON.parse(readFileSync("public/manifest.webmanifest","utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.icons.map(icon=>icon.sizes)).toEqual(["192x192","512x512"]);
  });
});
