import test from "node:test";
import assert from "node:assert/strict";

import {
 API_BASE_URL,
 extractImageUrls,
 getPrimaryImage,
 toAbsoluteImageUrl,
} from "../src/utils/imageHelpers.js";

test("toAbsoluteImageUrl returns absolute URL for relative path", () => {
 const result = toAbsoluteImageUrl("/uploads/sample.jpg");
 assert.equal(result, `${API_BASE_URL}/uploads/sample.jpg`);
});

test("extractImageUrls removes duplicates and keeps only valid strings", () => {
 const urls = extractImageUrls({
 imageUrl: "/uploads/a.jpg",
 imageUrls: ["/uploads/a.jpg", "", "  ", "/uploads/b.jpg"],
 });

 assert.deepEqual(urls, [
 `${API_BASE_URL}/uploads/a.jpg`,
 `${API_BASE_URL}/uploads/b.jpg`,
 ]);
});

test("getPrimaryImage falls back when entity has no image", () => {
 const fallback = "https://example.com/fallback.jpg";
 const result = getPrimaryImage({ name: "No Image" }, fallback);
 assert.equal(result, fallback);
});
