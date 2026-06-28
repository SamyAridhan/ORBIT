import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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
    expect(screen.getByLabelText("11 people waiting for Bus E at KDOJ").querySelectorAll("img")).toHaveLength(11);
    expect(screen.getByText(/Bus coming sooner/).closest("section")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(screen.getByRole("button", { name: "I'm waiting here" }));
    expect(screen.getByText("✓ You're counted — position 12 in queue")).toBeInTheDocument();
    const atTwelve = screen.getByLabelText("12 people waiting for Bus E at KDOJ").querySelectorAll("img");
    expect(atTwelve).toHaveLength(12);
    expect(atTwelve[11]).toHaveAttribute("width", "18");
    expect(atTwelve[11].getAttribute("src")).toContain("userPerson");

    advance(DEMO_TIMING.extraPeopleDelay);
    expect(screen.getByLabelText("13 people waiting for Bus E at KDOJ").querySelectorAll("img")).toHaveLength(13);
    advance(DEMO_TIMING.extraPeopleStagger);
    expect(screen.getByLabelText("14 people waiting for Bus E at KDOJ").querySelectorAll("img")).toHaveLength(14);
    advance(DEMO_TIMING.extraPeopleStagger);
    expect(screen.getByLabelText("15 people waiting for Bus E at KDOJ").querySelectorAll("img")).toHaveLength(15);
    advance(DEMO_TIMING.extraPeopleStagger);
    const atSixteen = screen.getByLabelText("16 people waiting for Bus E at KDOJ").querySelectorAll("img");
    expect(atSixteen).toHaveLength(16);
    expect(atSixteen[11].getAttribute("src")).toContain("userPerson");
    expect(atSixteen[12].getAttribute("src")).toContain("otherPerson");

    advance(DEMO_TIMING.dispatchDelay-DEMO_TIMING.extraPeopleDelay-(3*DEMO_TIMING.extraPeopleStagger));
    expect(screen.getByText("Bus coming sooner", { exact: false }).closest("section")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getAllByText("7").length).toBeGreaterThan(0);
    expect(screen.getByText(/You and 16 others/)).toBeInTheDocument();

    advance(DEMO_TIMING.dispatchHideDelay - DEMO_TIMING.dispatchDelay);
    expect(screen.getByText("Bus coming sooner", { exact: false }).closest("section")).toHaveAttribute("aria-hidden", "true");

    advance(DEMO_TIMING.boardingDelay - DEMO_TIMING.dispatchHideDelay);
    expect(screen.getByText("Bus E2 just arrived at KDOJ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "✓ I'm on the bus" }));
    expect(screen.getByText("Safe trip! 👋")).toBeInTheDocument();
  });
});

it("keeps demand signaling disabled outside the stop", () => {
  render(<MemoryRouter><ETA stop={STOPS[0]} atStop={false} corridor={Object.keys(CORRIDORS)[1]} /></MemoryRouter>);
  expect(screen.getByRole("button", { name: "I'm waiting here" })).toBeDisabled();
  expect(screen.getByText("Available when you arrive at KDOJ")).toBeInTheDocument();
});
