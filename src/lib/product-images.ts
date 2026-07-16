import coffee1 from "@/assets/product-coffee-1.jpg";
import coffee2 from "@/assets/product-coffee-2.jpg";
import coffee3 from "@/assets/product-coffee-3.jpg";
import pepper from "@/assets/product-pepper.jpg";
import cardamom from "@/assets/product-cardamom.jpg";
import cinnamon from "@/assets/product-cinnamon.jpg";
import cloves from "@/assets/product-cloves.jpg";
import vanilla from "@/assets/product-vanilla.jpg";
import gift from "@/assets/product-gift.jpg";

export const productImages: Record<string, string> = {
  "coffee-1": coffee1,
  "coffee-2": coffee2,
  "coffee-3": coffee3,
  pepper,
  cardamom,
  cinnamon,
  cloves,
  vanilla,
  gift,
};

export function imageFor(key: string): string {
  return productImages[key] ?? coffee1;
}
