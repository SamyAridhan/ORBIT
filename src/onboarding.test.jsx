import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import App from "./App";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

it.each(["Skip", "Get started →"])("leaves onboarding via %s", (buttonName) => {
  render(<MemoryRouter initialEntries={["/onboarding"]}><App /></MemoryRouter>);

  if (buttonName === "Get started →") {
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
    fireEvent.click(screen.getByRole("button", { name: "Next →" }));
  }

  fireEvent.click(screen.getByRole("button", { name: buttonName }));
  expect(screen.getByText("Where are you heading from?")).toBeInTheDocument();
  expect(localStorage.getItem("orbit_visited")).toBe("true");
});
