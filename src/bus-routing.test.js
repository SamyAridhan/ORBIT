import { describe, expect, it } from "vitest";
import { CORRIDORS, STOPS, getBusInfo } from "./data/mockData";

describe("stop and corridor bus assignment", () => {
  for (const stop of STOPS) {
    for (const corridor of stop.corridors) {
      it(`${stop.name} Bus ${corridor} shows the matching bus and selected stop`, () => {
        expect(CORRIDORS[corridor]).toBeDefined();
        const bus=getBusInfo(corridor,stop.id);
        expect(bus.corridor).toBe(corridor);
        expect(bus.id.startsWith(corridor)).toBe(true);
        expect(bus.routeToUser.at(-1)).toMatchObject({ id:stop.id, name:stop.name, isUserStop:true });
        expect(bus.routeToUser.every(routeStop=>routeStop.name)).toBe(true);
      });
    }
  }
});
