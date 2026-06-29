import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { C } from "./design/tokens";
import { CORRIDORS, DEMO_TIMING, STOPS } from "./data/mockData";
import ETA from "./screens/ETA";

afterEach(() => { cleanup(); vi.useRealTimers(); });

function renderDemo() {
  vi.useFakeTimers();
  render(<MemoryRouter><ETA stop={STOPS.find(stop => stop.id === "kdoj")} atStop corridor="E" /></MemoryRouter>);
}

function advance(milliseconds) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

describe.each([1, 2, 3, 4, 5])("critical demo run %i", () => {
  it("executes the full deterministic sequence", () => {
    renderDemo();
    expect(screen.getAllByText("14").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("11 people waiting for Bus E at KDOJ").querySelectorAll("svg")).toHaveLength(11);
    expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "I'm waiting for this bus" }));
    expect(screen.getByText("✓ You joined the queue · Number 12")).toBeInTheDocument();
    const atTwelve = screen.getByLabelText("12 people waiting for Bus E at KDOJ").querySelectorAll("svg");
    expect(atTwelve).toHaveLength(12);
    expect(atTwelve[11]).toHaveAttribute("width", "18");
    expect(atTwelve[11].querySelector("circle")).toHaveAttribute("fill",C.userBlue);

    advance(DEMO_TIMING.extraPeopleDelay);
    expect(screen.getByLabelText("13 people waiting for Bus E at KDOJ").querySelectorAll("svg")).toHaveLength(13);
    advance(DEMO_TIMING.extraPeopleStagger);
    expect(screen.getByLabelText("14 people waiting for Bus E at KDOJ").querySelectorAll("svg")).toHaveLength(14);
    advance(DEMO_TIMING.extraPeopleStagger);
    expect(screen.getByLabelText("15 people waiting for Bus E at KDOJ").querySelectorAll("svg")).toHaveLength(15);
    advance(DEMO_TIMING.extraPeopleStagger);
    const atSixteen = screen.getByLabelText("16 people waiting for Bus E at KDOJ").querySelectorAll("svg");
    expect(atSixteen).toHaveLength(16);
    expect(atSixteen[11].querySelector("circle")).toHaveAttribute("fill",C.userBlue);
    expect(atSixteen[12].querySelector("circle")).toHaveAttribute("fill",C.personBlack);

    advance(DEMO_TIMING.dispatchDelay-DEMO_TIMING.extraPeopleDelay-(3*DEMO_TIMING.extraPeopleStagger));
    expect(screen.getByText("Bus E2 is leaving early", { exact: false }).closest("section")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);
    expect(screen.getByText(/Because 16 students are waiting/)).toBeInTheDocument();

    advance(DEMO_TIMING.dispatchHideDelay - DEMO_TIMING.dispatchDelay);
    expect(screen.getByText("Bus E2 is leaving early", { exact: false }).closest("section")).toHaveAttribute("aria-hidden", "true");

    advance(DEMO_TIMING.boardingDelay - DEMO_TIMING.dispatchHideDelay);
    expect(screen.getByText("Bus E2 just arrived at KDOJ")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("12 people waiting for Bus E at KDOJ")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("8 people waiting for Bus E at KDOJ")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("4 people waiting for Bus E at KDOJ")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("0 people waiting for Bus E at KDOJ")).toBeInTheDocument();
    expect(screen.getByText("Everyone waiting has boarded")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "✓ Yes, I'm on" }));
    expect(screen.getByText("Have a safe trip! 👋")).toBeInTheDocument();
  });
});

it("keeps demand signaling disabled outside the stop", () => {
  render(<MemoryRouter><ETA stop={STOPS[0]} atStop={false} corridor={Object.keys(CORRIDORS)[1]} /></MemoryRouter>);
  expect(screen.getByText("LIVE")).toBeInTheDocument();
  expect(screen.queryByText(/You're viewing live info/)).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "🔒 Go to KDOJ to join the queue" })).toBeDisabled();
  expect(screen.getByText("You need to be at the stop before you can join its live queue.")).toBeInTheDocument();
});
