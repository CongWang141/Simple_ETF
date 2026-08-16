import assert from "node:assert/strict";
import test from "node:test";
import { loadTypeScriptModule } from "../helpers/load-typescript.mjs";

const { buildComparisonOverlay, calculateTotalReturnForDateRange, findVerticallyClosestSeries, normalizeReturnIndex } = await loadTypeScriptModule("lib/return-calculations.ts");

test("normalizes a total-return index to the selected starting value", () => {
  assert.deepEqual(normalizeReturnIndex([
    { date: "2024-01-31", totalReturnIndex: 100 },
    { date: "2024-02-29", totalReturnIndex: 112.5 },
    { date: "2024-03-31", totalReturnIndex: 90 },
  ]), [
    { date: "2024-01-31", totalReturnIndex: 100, normalizedReturnPct: 0 },
    { date: "2024-02-29", totalReturnIndex: 112.5, normalizedReturnPct: 12.5 },
    { date: "2024-03-31", totalReturnIndex: 90, normalizedReturnPct: -10 },
  ]);
  assert.deepEqual(normalizeReturnIndex([]), []);
});

test("calculates total return from the available dates in a requested calendar period", () => {
  const points = [
    { date: "2024-01-02", totalReturnIndex: 100 },
    { date: "2024-06-28", totalReturnIndex: 105 },
    { date: "2024-12-31", totalReturnIndex: 112.5 },
  ];
  assert.equal(calculateTotalReturnForDateRange(points, "2024-01-01", "2024-12-31"), 12.5);
  assert.equal(calculateTotalReturnForDateRange(points, "2025-01-01", "2025-12-31"), null);
});

test("uses only common dates when normalizing a comparison", () => {
  const overlay = buildComparisonOverlay(["A", "B"], {
    A: [{ date: "2024-01-31", totalReturnIndex: 100 }, { date: "2024-02-29", totalReturnIndex: 110 }, { date: "2024-03-31", totalReturnIndex: 121 }],
    B: [{ date: "2024-02-29", totalReturnIndex: 50 }, { date: "2024-03-31", totalReturnIndex: 55 }],
  });
  assert.deepEqual(overlay.data, [
    { date: "2024-02-29", A: 0, B: 0 },
    { date: "2024-03-31", A: 10, B: 10 },
  ]);
  assert.match(overlay.message, /2024-02-29 to 2024-03-31/);
});

test("explains comparison edge cases", () => {
  assert.match(buildComparisonOverlay(["A"], {}).message, /at least two ETFs/);
  assert.match(buildComparisonOverlay(["A", "B"], {
    A: [{ date: "2024-01-31", totalReturnIndex: 100 }],
    B: [{ date: "2024-02-29", totalReturnIndex: 100 }],
  }).message, /no overlapping history/);
});

test("selects a comparison series by vertical distance only", () => {
  const values = { LOW: 10, MIDDLE: 50, HIGH: 90 };
  assert.equal(findVerticallyClosestSeries(values, 48, [0, 100], 0, 100), "MIDDLE");
  assert.equal(findVerticallyClosestSeries(values, 12, [0, 100], 0, 100), "HIGH");
  assert.equal(findVerticallyClosestSeries(values, 88, [0, 100], 0, 100), "LOW");
  assert.equal(findVerticallyClosestSeries(values, 50, [1, 1], 0, 100), null);
});
