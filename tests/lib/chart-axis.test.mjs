import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "../helpers/load-typescript.mjs";

const { getCalendarDateTicks, getNiceNumericAxis } = await loadTypeScriptModule("lib/chart-axis.ts");

test("creates evenly spaced nice numeric ticks that contain the data range", () => {
  const axis = getNiceNumericAxis([1.2, 8.7, 12.1]);
  assert.equal(axis.step, 5);
  assert.deepEqual(axis.domain, [0, 15]);
  assert.deepEqual(axis.ticks, [0, 5, 10, 15]);
});

test("chooses calendar-based chart ticks rather than observation-count intervals", () => {
  const dates = ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "2024-01-08", "2024-01-09", "2024-01-10", "2024-01-11", "2024-01-12", "2024-01-15", "2024-01-16", "2024-01-17", "2024-01-18", "2024-01-19", "2024-01-22", "2024-01-23", "2024-01-24", "2024-01-25", "2024-01-26", "2024-01-29", "2024-01-30", "2024-01-31"];
  const ticks = getCalendarDateTicks(dates);
  assert.equal(ticks[0], "2024-01-02");
  assert.equal(ticks.at(-1), "2024-01-31");
  assert.ok(ticks.length < dates.length);
});
