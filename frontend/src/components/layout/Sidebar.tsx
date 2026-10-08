import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { BrandLogo } from "@/components/shared/BrandLogo";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavLink {
  to: string;
  label: string;
  roles: Role[];
}

const links: NavLink[] = [
  { to: "/dashboard", label: "Dashboard", roles: ["ADMIN", "OWNER", "CARETAKER", "TENANT"] },
  { to: "/complaints", label: "Complaints", roles: ["OWNER", "CARETAKER", "TENANT"] },
  { to: "/complaints/submit", label: "Submit Complaint", roles: ["CARETAKER", "TENANT"] },
  { to: "/rent-confirmations", label: "Rent Confirmations", roles: ["OWNER", "CARETAKER"] },
  { to: "/reports/monthly", label: "Monthly Reports", roles: ["OWNER", "CARETAKER"] },
  { to: "/complaints/caretaker-review", label: "Caretaker Review Queue", roles: ["CARETAKER"] },
  { to: "/complaints/owner-approval", label: "Approved Complaints", roles: ["OWNER"] },
  { to: "/admin/registrations", label: "Pending Registrations", roles: ["ADMIN"] },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();
  const role = useAppSelector((state) => state.auth.user?.role);

  const nav = links.filter((item) => role && item.roles.includes(role));

  const navContent = (
    <nav className="space-y-1 sm:space-y-2">
      {nav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onCloseMobile}
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition hover:bg-sky-50",
            location.pathname === item.to ? "bg-sky-100 text-sky-700 font-medium" : "text-slate-700",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r bg-white p-4">
        <h1 className="mb-6">
          <BrandLogo textClassName="text-lg" />
        </h1>
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r bg-white p-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <BrandLogo textClassName="text-lg" />
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                onClick={onCloseMobile}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
