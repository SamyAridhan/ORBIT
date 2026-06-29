import React from "react";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {afterEach,describe,expect,it} from "vitest";
import App from "./App";
import {deriveState,STEPS} from "./data/mockData";

afterEach(cleanup);

describe("deterministic replay",()=>{
  it("returns fresh canonical state for every direct step",()=>{for(let step=0;step<STEPS.length;step+=1){const expected=deriveState(step),changed=deriveState(step);changed.buses[0].load=999;changed.stops[0].queue=999;expect(deriveState(step)).toEqual(expected);}});
  it("matches the full-bus overflow scenario",()=>{const initial=deriveState(0);expect(initial.buses.find(bus=>bus.id==="E1")).toMatchObject({load:8,eta:0,status:"BOARDING",position:"KDOJ"});expect(initial.buses.find(bus=>bus.id==="E2")).toMatchObject({load:0,eta:20,status:"IDLE",position:"KDOJ"});expect(initial.stops.find(stop=>stop.id==="kdse_e").queue).toBe(18);expect(initial.stops.find(stop=>stop.id==="kdoj_e").queue).toBe(22);expect(deriveState(1).buses.find(bus=>bus.id==="E1")).toMatchObject({load:28,eta:7,position:"KDOJ → KDSE"});expect(deriveState(7).buses.find(bus=>bus.id==="E2")).toMatchObject({eta:7,etaGain:10});expect(deriveState(9).buses.find(bus=>bus.id==="E2").load).toBe(20);});
});

it("navigates all ten steps forward and backward five times without drift",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"}),previous=screen.getByRole("button",{name:"Previous step"});for(let run=0;run<5;run+=1){for(let step=1;step<10;step+=1)fireEvent.click(next);expect(screen.getByText("7:47 · Both overflow queues are clear")).toBeInTheDocument();expect(screen.getByText("Overflow cleared")).toBeInTheDocument();expect(screen.getAllByText("5 updates")).toHaveLength(2);expect(within(screen.getByLabelText("Stop KDSE")).getByText("0")).toBeInTheDocument();for(let step=9;step>0;step-=1)fireEvent.click(previous);expect(screen.getByText("7:30 · E1 starts its route from KDOJ")).toBeInTheDocument();expect(screen.getByText(/Press the right arrow/)).toBeInTheDocument();}});

it("clears a simulated plan change when replay navigation resumes",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"});for(let step=1;step<=5;step+=1)fireEvent.click(next);fireEvent.click(screen.getByRole("button",{name:"Change the plan for Bus E2"}));fireEvent.click(screen.getByRole("button",{name:"Return to schedule"}));expect(screen.getByText("Bus returned to schedule")).toBeInTheDocument();fireEvent.click(next);expect(screen.queryByText("Bus returned to schedule")).not.toBeInTheDocument();expect(screen.getByText("Bus E2 is assigned to the overflow")).toBeInTheDocument();});

it("records two independent missed-bus impacts",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"});fireEvent.click(next);expect(screen.getByText("2 students missed E1")).toBeInTheDocument();expect(screen.getByText("E1 left KDOJ full · 2 students remain at the stop")).toBeInTheDocument();fireEvent.click(next);expect(screen.getByText("18 students missed E1")).toBeInTheDocument();expect(screen.getByText("E1 reached KDSE full · All 18 students remain at the stop")).toBeInTheDocument();expect(screen.getAllByText(/students missed E1/)).toHaveLength(2);});

it("combines evaluation and safety checks into one decision",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"});for(let step=1;step<=4;step+=1)fireEvent.click(next);expect(screen.queryByText(/Checking earlier departure/)).not.toBeInTheDocument();fireEvent.click(next);expect(screen.getByText("Earlier departure approved")).toBeInTheDocument();expect(screen.getByText("Bus E2 will leave at 7:40 instead of 7:50 · All 6 safety checks passed, including a safe 10-minute gap behind E1")).toBeInTheDocument();expect(screen.queryByText("SAME ROUTE ✓")).not.toBeInTheDocument();});

it("logs only impact, decision, action, and resolution",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"});for(let step=1;step<10;step+=1)fireEvent.click(next);expect(screen.getByText("Relief trip started")).toBeInTheDocument();expect(screen.getByText("Overflow cleared")).toBeInTheDocument();expect(screen.getAllByText("5 updates")).toHaveLength(2);expect(screen.queryByText(/Bus full at/)).not.toBeInTheDocument();expect(screen.queryByText(/Queue cleared/)).not.toBeInTheDocument();});
