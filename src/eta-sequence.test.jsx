import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import React from "react";
import {MemoryRouter} from "react-router-dom";
import {afterEach,describe,expect,it,vi} from "vitest";
import {C} from "./design/tokens";
import {CORRIDORS,DEMO_TIMING,STOPS} from "./data/mockData";
import ETA from "./screens/ETA";

afterEach(()=>{cleanup();vi.useRealTimers()});
const renderDemo=()=>{vi.useFakeTimers();render(<MemoryRouter><ETA stop={STOPS.find(stop=>stop.id==="kdse")} atStop corridor="E"/></MemoryRouter>)};
const advance=milliseconds=>act(()=>vi.advanceTimersByTime(milliseconds));

describe.each([1,2,3,4,5])("overflow demo run %i",()=>{
  it("reports a full bus and completes the early E2 pickup",()=>{
    renderDemo();
    expect(screen.getAllByText("Bus E1").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("17 people waiting for Bus E at KDSE").querySelectorAll("svg")).toHaveLength(17);
    fireEvent.click(screen.getByRole("button",{name:"I'm waiting for this bus"}));
    expect(screen.getByText("✓ You joined the queue · Number 18")).toBeInTheDocument();
    const queue=screen.getByLabelText("18 people waiting for Bus E at KDSE").querySelectorAll("svg");
    expect(queue).toHaveLength(18);
    expect(queue[17].querySelector("circle")).toHaveAttribute("fill",C.userBlue);

    advance(DEMO_TIMING.firstBusDelay);
    expect(screen.getByText("Bus E1 arrived full")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"I missed this bus"}));
    expect(screen.getByText(/reported the full bus/)).toBeInTheDocument();
    expect(screen.getAllByText("Bus E2").length).toBeGreaterThan(0);

    advance(DEMO_TIMING.dispatchDelay);
    expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden","false");
    expect(screen.getByText(/left KDOJ/)).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    advance(DEMO_TIMING.dispatchHideDelay-DEMO_TIMING.dispatchDelay);
    expect(screen.getByText(/Bus E2 is leaving early/).closest("section")).toHaveAttribute("aria-hidden","true");

    advance(DEMO_TIMING.boardingDelay-DEMO_TIMING.dispatchHideDelay);
    expect(screen.getByText("Bus E2 just arrived at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("12 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("6 people waiting for Bus E at KDSE")).toBeInTheDocument();
    advance(DEMO_TIMING.boardingStagger);
    expect(screen.getByLabelText("0 people waiting for Bus E at KDSE")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button",{name:"✓ Yes, I'm on"}));
    expect(screen.getByText("Have a safe trip! 👋")).toBeInTheDocument();
  });
});

it("keeps queue joining disabled outside the stop",()=>{
  render(<MemoryRouter><ETA stop={STOPS[0]} atStop={false} corridor={Object.keys(CORRIDORS)[1]}/></MemoryRouter>);
  expect(screen.getByText("LIVE")).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"🔒 Go to KDOJ to join the queue"})).toBeDisabled();
  expect(screen.getByText("You need to be at the stop before you can join its live queue.")).toBeInTheDocument();
});
