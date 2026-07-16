export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function categoryLabel(category: "coffee" | "spice" | "gift"): string {
  if (category === "coffee") return "Coffee";
  if (category === "spice") return "Spice";
  return "Gift";
}
