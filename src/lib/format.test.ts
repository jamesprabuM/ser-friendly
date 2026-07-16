import { describe, it, expect } from "vitest";
import { formatPrice, categoryLabel } from "./format";

describe("formatPrice", () => {
  it("formats paise as INR currency", () => {
    const out = formatPrice(150000);
    expect(out).toContain("1,500");
    expect(out).toMatch(/₹|INR/);
  });

  it("rounds to whole rupees", () => {
    expect(formatPrice(199)).not.toContain(".");
  });
});

describe("categoryLabel", () => {
  it("returns human-readable labels", () => {
    expect(categoryLabel("coffee")).toBe("Coffee");
    expect(categoryLabel("spice")).toBe("Spice");
    expect(categoryLabel("gift")).toBe("Gift");
  });
});
