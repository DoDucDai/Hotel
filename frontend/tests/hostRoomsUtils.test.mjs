import test from "node:test";
import assert from "node:assert/strict";

import {
 addDays,
 approvalMeta,
 normalizeList,
 parseCommaList,
 todayString,
} from "../src/features/host/hostRoomsUtils.js";

test("todayString and addDays return ISO date slices", () => {
 const today = todayString();
 assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
 assert.equal(addDays("2026-01-01", 2), "2026-01-03");
});

test("normalizeList accepts plain and wrapped arrays", () => {
 assert.deepEqual(normalizeList([{ id: 1 }]), [{ id: 1 }]);
 assert.deepEqual(normalizeList({ content: [{ id: 2 }] }), [{ id: 2 }]);
 assert.deepEqual(normalizeList({ data: [{ id: 3 }] }), [{ id: 3 }]);
 assert.deepEqual(normalizeList(null), []);
});

test("parseCommaList trims and removes empties", () => {
 assert.deepEqual(parseCommaList("Wifi,  Bai do xe,, Le tan"), [
 "Wifi",
 "Bai do xe",
 "Le tan",
 ]);
});

test("approvalMeta maps known statuses and fallback", () => {
 assert.equal(approvalMeta("APPROVED").className, "success");
 assert.equal(approvalMeta("REJECTED").className, "danger");
 assert.equal(approvalMeta("PENDING").className, "pending");
});
