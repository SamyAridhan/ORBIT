import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it } from "vitest";
import App from "./App";

beforeEach(()=>localStorage.setItem("orbit_visited","true"));
afterEach(cleanup);

it("navigates Home to a bus ETA and back without crashing", () => {
  render(<MemoryRouter initialEntries={["/"]}><App/></MemoryRouter>);
  expect(screen.queryByRole("button",{name:/DEBUG/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button",{name:/KDOJ Kolej Dato' Onn Jaafar/}));
  expect(screen.getByText("Where are you going?")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button",{name:/Faculty Cluster/}));
  expect(screen.getAllByText("Bus E2").length).toBeGreaterThan(0);
  expect(screen.queryByText("This screen hit an error")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button",{name:"Back"}));
  expect(screen.getByText("Where are you going?")).toBeInTheDocument();
  expect(screen.queryByText("This screen hit an error")).not.toBeInTheDocument();
});
