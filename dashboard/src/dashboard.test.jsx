import React from "react";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,describe,expect,it} from "vitest";
import App from "./App";
import {deriveState,STEPS} from "./data/mockData";
afterEach(cleanup);
describe("deterministic replay",()=>{
  it("returns fresh canonical state for every direct step",()=>{for(let step=0;step<STEPS.length;step+=1){const expected=deriveState(step),changed=deriveState(step);changed.buses[0].load=999;changed.stops[0].queue=999;expect(deriveState(step)).toEqual(expected);}});
  it("matches the student PWA at key steps",()=>{expect(deriveState(0).buses.find(bus=>bus.id==="E2")).toMatchObject({load:14,eta:14,status:"COMMUTING"});expect(deriveState(0).stops[0].queue).toBe(11);expect(deriveState(2).stops[0].queue).toBe(16);expect(deriveState(6).buses.find(bus=>bus.id==="E2").eta).toBe(7);});
});
it("navigates all ten steps forward and backward five times without visible drift",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"}),previous=screen.getByRole("button",{name:"Previous step"});for(let run=0;run<5;run+=1){for(let step=1;step<10;step+=1)fireEvent.click(next);expect(screen.getByText("E2 arrives and boarding prompt is sent")).toBeInTheDocument();expect(screen.getByText("BOARDING PROMPT SENT")).toBeInTheDocument();for(let step=9;step>0;step-=1)fireEvent.click(previous);expect(screen.getByText("Initial live state")).toBeInTheDocument();expect(screen.getByText(/Press →/)).toBeInTheDocument();}});
it("clears a simulated override when demo navigation resumes",()=>{render(<App/>);const next=screen.getByRole("button",{name:"Next step"});for(let step=1;step<=6;step+=1)fireEvent.click(next);fireEvent.click(screen.getByRole("button",{name:"Override timing for Bus E2"}));expect(screen.getByRole("dialog",{name:"Override Bus E2"})).toBeInTheDocument();fireEvent.click(screen.getByRole("button",{name:"Confirm override"}));expect(screen.getByText("TIMING OVERRIDE CONFIRMED")).toBeInTheDocument();fireEvent.click(next);expect(screen.queryByText("TIMING OVERRIDE CONFIRMED")).not.toBeInTheDocument();expect(screen.getByText("KDOJ claimed by Bus E2")).toBeInTheDocument();});
