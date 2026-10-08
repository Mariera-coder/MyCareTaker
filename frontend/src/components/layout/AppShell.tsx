import { useState, type PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AppFooter } from "@/components/layout/AppFooter";

export function AppShell({ children }: PropsWithChildren) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
