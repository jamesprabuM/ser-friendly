export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function categoryLabel(category: "coffee" | "spice" | "gift"): string {
  if (category === "coffee") return "Coffee";
  if (category === "spice") return "Spice";
  return "Gift";
}
