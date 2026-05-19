import test from "node:test";
import assert from "node:assert/strict";

import {
  addDaysToDateInput,
  formatDateInputLocal,
  parseDateInputLocal,
} from "../src/utils/dateInput.js";

test("formatDateInputLocal returns YYYY-MM-DD in local calendar", () => {
  const value = formatDateInputLocal(new Date(2026, 3, 6, 23, 45, 0));
  assert.equal(value, "2026-04-06");
});

test("parseDateInputLocal validates malformed values", () => {
  assert.equal(parseDateInputLocal("2026-02-30"), null);
  assert.equal(parseDateInputLocal("2026-04-06")?.getDate(), 6);
});

test("addDaysToDateInput keeps local date format", () => {
  assert.equal(addDaysToDateInput("2026-12-31", 1), "2027-01-01");
});
