export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function categoryLabel(c: string): string {
  if (c === "coffee") return "Coffee";
  if (c === "spice") return "Spice";
  if (c === "gift") return "Gift";
  return c;
}
