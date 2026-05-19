import { API_BASE_URL } from "./apiConfig.js";

export { API_BASE_URL };

function hasText(value) {
 return typeof value === "string" && value.trim().length > 0;
}

export function toAbsoluteImageUrl(value) {
 if (!hasText(value)) {
 return "";
 }

 if (
 value.startsWith("http://") ||
 value.startsWith("https://") ||
 value.startsWith("data:") ||
 value.startsWith("blob:")
 ) {
 return value;
 }

 return `${API_BASE_URL}${value}`;
}

export function extractImageUrls(entity, options = {}) {
 const { includeNameFallback = false } = options;
 const rawUrls = [];

 if (Array.isArray(entity?.imageUrls)) {
 rawUrls.push(...entity.imageUrls);
 }

 if (hasText(entity?.imageUrl)) {
 rawUrls.push(entity.imageUrl);
 }

 if (includeNameFallback && hasText(entity?.name)) {
 rawUrls.push(`/uploads/${encodeURIComponent(entity.name)}.jpg`);
 }

 return rawUrls
 .map(toAbsoluteImageUrl)
 .filter(Boolean)
 .filter((value, index, all) => all.indexOf(value) === index);
}

export function getPrimaryImage(entity, fallbackImage, options = {}) {
 return extractImageUrls(entity, options)[0] || fallbackImage;
}
