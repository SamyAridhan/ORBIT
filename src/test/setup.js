import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

globalThis.React = React;

vi.mock("lottie-web/build/player/lottie_light.js", () => ({
  default: {
    loadAnimation: () => ({
      addEventListener: vi.fn(), removeEventListener: vi.fn(), destroy: vi.fn(), setSpeed: vi.fn(),
    }),
  },
}));
