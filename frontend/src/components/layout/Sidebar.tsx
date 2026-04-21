import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const location = useLocation();
  const role = useAppSelector((state) => state.auth.user?.role);

  const nav = links.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-64 border-r bg-white p-4">
      <h1 className="mb-6 text-xl font-bold text-sky-700">MyCareTaker</h1>
      <nav className="space-y-2">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition hover:bg-sky-50",
              location.pathname === item.to ? "bg-sky-100 text-sky-700" : "text-slate-700",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
