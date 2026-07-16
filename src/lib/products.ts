import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: "coffee" | "spice" | "gift";
  roast: "light" | "medium" | "dark" | "none" | null;
  price_cents: number;
  weight: string | null;
  origin: string | null;
  short_description: string | null;
  description: string | null;
  tasting_notes: string[] | null;
  image_key: string;
  stock: number;
  featured: boolean;
  published: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}
