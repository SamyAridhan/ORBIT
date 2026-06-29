import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { C } from "./design/tokens";
import { CORRIDORS, DEMO_TIMING, INITIAL_WAITING, STOPS } from "./data/mockData";
import ETA from "./screens/ETA";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderEta = corridor => {
  vi.useFakeTimers();
  render(<MemoryRouter><ETA stop={STOPS.find(stop => stop.id === "kdse")} atStop corridor={corridor} /></MemoryRouter>);
};

const advance = milliseconds => act(() => vi.advanceTimersByTime(milliseconds));

describe.each([1, 2, 3, 4, 5])("overflow demo run %i", () => {
  it("reports a missed Bus E and completes the early E2 pickup", () => {
    renderEta("E");
    expect(screen.getAllByText("Bus E1").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(`${INITIAL_WAITING} people waiting for Bus E at KDSE`).querySelectorAll("svg")).toHaveLength(INITIAL_WAITING);

    fireEvent.click(screen.getByRole("button", { name: "I'm waiting for this bus" }));
    expect(screen.getByText("✓ You’re in the live queue")).toBeInTheDocument();
    expect(screen.getByLabelText("9 people waiting for Bus E at KDSE").querySelectorAll("svg")).toHaveLength(9);
    expect(screen.getByLabelText("9 people waiting for Bus E at KDSE").querySelectorAll("svg")[8].querySelector("circle")).toHaveAttribute("fill", C.userBlue);

    advance(DEMO_TIMING.queueGrowthTimes[0]);
    expect(screen.getByLabelText("10 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.queueGrowthTimes[1] - DEMO_TIMING.queueGrowthTimes[0]);
    expect(screen.getByLabelText("11 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.queueGrowthTimes[2] - DEMO_TIMING.queueGrowthTimes[1]);
    expect(screen.getByLabelText("12 people waiting for Bus E at KDSE")).toBeInTheDocument();

    advance(DEMO_TIMING.progressFirstDelay - DEMO_TIMING.queueGrowthTimes[2]);
    expect(screen.getByText("Leaving KDOJ")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    advance(DEMO_TIMING.progressSecondDelay - DEMO_TIMING.progressFirstDelay);
    expect(screen.getByText("Approaching KDSE")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    advance(DEMO_TIMING.firstBusDelay - DEMO_TIMING.progressSecondDelay);
    expect(screen.getByText("Bus E1 just arrived at KDSE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, I got on" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "No, I missed it" }));
    expect(screen.getByText("✓ Don’t worry, you’re still in the queue")).toBeInTheDocument();
    expect(screen.getAllByText("Bus E2").length).toBeGreaterThan(0);

    advance(DEMO_TIMING.dispatchDelay);
    expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText(/left KDOJ/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("✓ Don’t worry, you’re still in the queue")).not.toBeInTheDocument();

    advance(DEMO_TIMING.boardingDelay - DEMO_TIMING.dispatchDelay);
    expect(screen.getByText("Bus E2 just arrived at KDSE")).toBeInTheDocument();
    expect(screen.getByLabelText("12 people waiting for Bus E at KDSE")).toBeInTheDocument();

    advance(DEMO_TIMING.boardingOffsets[0]);
    expect(screen.getByLabelText("11 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingOffsets[1] - DEMO_TIMING.boardingOffsets[0]);
    expect(screen.getByLabelText("10 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingOffsets.at(-1) - DEMO_TIMING.boardingOffsets[1]);
    expect(screen.getByLabelText("1 person waiting for Bus E at KDSE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Yes, I’m on/ }));
    expect(screen.getByLabelText("0 people waiting for Bus E at KDSE")).toBeInTheDocument();
    expect(screen.getByText("Nice, you’re all set. Have a safe trip.")).toBeInTheDocument();
  });
});

it("hides the missed-bus queue message when the new bus prompt appears", () => {
  renderEta("E");
  fireEvent.click(screen.getByRole("button", { name: "I'm waiting for this bus" }));

  advance(DEMO_TIMING.firstBusDelay);
  fireEvent.click(screen.getByRole("button", { name: "No, I missed it" }));
  expect(screen.getByText("✓ Don’t worry, you’re still in the queue")).toBeInTheDocument();

  advance(DEMO_TIMING.dispatchDelay);
  expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "false");

  advance(DEMO_TIMING.boardingDelay - DEMO_TIMING.dispatchDelay);
  expect(screen.getByText("Bus E2 just arrived at KDSE")).toBeInTheDocument();
  expect(screen.queryByText("✓ Don’t worry, you’re still in the queue")).not.toBeInTheDocument();
  expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "true");
});

it("keeps queue joining disabled outside the stop", () => {
  render(<MemoryRouter><ETA stop={STOPS[0]} atStop={false} corridor={Object.keys(CORRIDORS)[1]} /></MemoryRouter>);
  expect(screen.getByText("LIVE")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Go to KDOJ to join the queue/ })).toBeDisabled();
  expect(screen.getByText("You need to be at the stop before you can join its live queue.")).toBeInTheDocument();
});

it("uses the normal progress and boarded prompt for Bus D at KDSE", () => {
  renderEta("D");
  expect(screen.getAllByText("Bus D2").length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: "I'm waiting for this bus" }));

  advance(DEMO_TIMING.queueGrowthTimes[2]);
  expect(screen.getByLabelText("12 people waiting for Bus D at KDSE")).toBeInTheDocument();
  advance(DEMO_TIMING.progressFirstDelay - DEMO_TIMING.queueGrowthTimes[2]);
  expect(screen.getByText("Arrived at KLG")).toBeInTheDocument();
  expect(screen.getByText("6")).toBeInTheDocument();
  advance(DEMO_TIMING.progressSecondDelay - DEMO_TIMING.progressFirstDelay);
  expect(screen.getByText("Leaving KLG for KDSE")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  advance(DEMO_TIMING.firstBusDelay - DEMO_TIMING.progressSecondDelay);

  expect(screen.getByText("Bus D2 just arrived at KDSE")).toBeInTheDocument();
  expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByLabelText("12 people waiting for Bus D at KDSE")).toBeInTheDocument();
  advance(DEMO_TIMING.boardingOffsets[0]);
  expect(screen.getByLabelText("11 people waiting for Bus D at KDSE")).toBeInTheDocument();
  advance(DEMO_TIMING.boardingOffsets.at(-1) - DEMO_TIMING.boardingOffsets[0]);
  expect(screen.getByLabelText("1 person waiting for Bus D at KDSE")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Yes, I’m on/ }));
  expect(screen.getByLabelText("0 people waiting for Bus D at KDSE")).toBeInTheDocument();
  expect(screen.getByText("Nice, you’re all set. Have a safe trip.")).toBeInTheDocument();
});
