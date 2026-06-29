import React from "react";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {afterEach,beforeEach,expect,it} from "vitest";
import App from "./App";

beforeEach(()=>localStorage.clear());
afterEach(cleanup);

it.each(["Skip","Start using ORBIT →"])("leaves onboarding via %s",buttonName=>{
  render(<MemoryRouter initialEntries={["/onboarding"]}><App/></MemoryRouter>);
  if(buttonName==="Start using ORBIT →") for(let index=1;index<6;index+=1) fireEvent.click(screen.getByRole("button",{name:"Continue →"}));
  fireEvent.click(screen.getByRole("button",{name:buttonName}));
  expect(screen.getByText("Which bus stop are you at?")).toBeInTheDocument();
  expect(localStorage.getItem("orbit_visited")).toBe("true");
});

it("explains boarded and missed-bus responses before completion",()=>{
  const {container}=render(<MemoryRouter initialEntries={["/onboarding"]}><App/></MemoryRouter>);
  expect(container.querySelector("main")).toHaveClass("h-[100dvh]","overflow-hidden");
  expect(document.body).toHaveClass("onboarding-active");
  fireEvent.click(screen.getByRole("button",{name:"Show page 5"}));
  expect(screen.getByText("Tell us when you get on")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:"Continue →"}));
  expect(screen.getByText("Missed the bus? Don’t worry")).toBeInTheDocument();
  expect(screen.getByRole("button",{name:"Start using ORBIT →"})).toBeInTheDocument();
});
