import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { CartDrawer } from "./cart-drawer";

export function SiteLayout({ children, transparentHeader = false }: { children: ReactNode; transparentHeader?: boolean }) {
  return (
    <div className={transparentHeader ? "min-h-screen" : "min-h-screen"}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
