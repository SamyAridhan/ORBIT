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
    for(let index=1;index<6;index+=1) fireEvent.click(screen.getByRole("button", { name: "Next →" }));
  }

  fireEvent.click(screen.getByRole("button", { name: buttonName }));
  expect(screen.getByText("Where are you heading from?")).toBeInTheDocument();
  expect(localStorage.getItem("orbit_visited")).toBe("true");
});

it("explains boarded and missed-bus responses before completion", () => {
  render(<MemoryRouter initialEntries={["/onboarding"]}><App /></MemoryRouter>);
  fireEvent.click(screen.getByRole("button",{name:"Go to card 5"}));
  expect(screen.getByText("Got on the bus? Give ORBIT a quick update")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Next →"}));
  expect(screen.getByText("Missed it? You're still part of the plan")).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Get started →"})).toBeInTheDocument();
});
