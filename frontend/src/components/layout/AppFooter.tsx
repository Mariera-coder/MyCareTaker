import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  Home,
  Mail,
  Shield,
  Wrench,
  Building2,
  FileText,
  CreditCard,
  MessageSquare,
  Users,
  CheckSquare,
} from "lucide-react";

const adminEmail = "marieramichael01@gmail.com";

interface FooterLink {
  to: string;
  label: string;
  icon: React.ElementType;
}

const tenantLinks: FooterLink[] = [
  { to: "/dashboard", label: "My Dashboard", icon: Home },
  { to: "/complaints", label: "View Complaints", icon: MessageSquare },
  { to: "/complaints/submit", label: "Submit a Complaint", icon: Wrench },
];

const caretakerLinks: FooterLink[] = [
  { to: "/dashboard", label: "Estate Overview", icon: Building2 },
  { to: "/complaints/caretaker-review", label: "Review Queue", icon: CheckSquare },
  { to: "/complaints", label: "All Complaints", icon: MessageSquare },
  { to: "/rent-confirmations", label: "Rent Confirmations", icon: CreditCard },
  { to: "/reports/monthly", label: "Monthly Reports", icon: FileText },
];

const ownerLinks: FooterLink[] = [
  { to: "/dashboard", label: "Owner Dashboard", icon: Building2 },
  { to: "/complaints/owner-approval", label: "Approved Complaints", icon: CheckSquare },
  { to: "/complaints", label: "All Complaints", icon: MessageSquare },
  { to: "/rent-confirmations", label: "Rent Confirmations", icon: CreditCard },
  { to: "/reports/monthly", label: "Monthly Reports", icon: FileText },
];

const adminLinks: FooterLink[] = [
  { to: "/dashboard", label: "Admin Center", icon: Shield },
  { to: "/admin/registrations", label: "Pending Registrations", icon: Users },
];

const roleConfig: Record<
  string,
  { label: string; gradient: string; accentDot: string; tagline: string; links: FooterLink[] }
> = {
  TENANT: {
    label: "Tenant Portal",
    gradient: "from-sky-900 to-sky-950",
    accentDot: "bg-sky-400",
    tagline: "Track your rent, raise concerns, and stay informed about your home.",
    links: tenantLinks,
  },
  CARETAKER: {
    label: "Caretaker Workspace",
    gradient: "from-emerald-900 to-emerald-950",
    accentDot: "bg-emerald-400",
    tagline: "Manage complaints, confirm payments, and keep your estates running smoothly.",
    links: caretakerLinks,
  },
  OWNER: {
    label: "Owner Console",
    gradient: "from-amber-900 to-amber-950",
    accentDot: "bg-amber-400",
    tagline: "Monitor your properties, review approvals, and access financial summaries.",
    links: ownerLinks,
  },
  ADMIN: {
    label: "Admin Panel",
    gradient: "from-slate-800 to-slate-950",
    accentDot: "bg-slate-400",
    tagline: "Oversee registrations, manage users, and maintain platform health.",
    links: adminLinks,
  },
};

export function AppFooter() {
  const { user, selectedEstateId, availableEstates } = useAppSelector((state) => state.auth);
  const role = user?.role ?? "TENANT";
  const config = roleConfig[role] ?? roleConfig.TENANT;
  const selectedEstate = availableEstates.find((e) => e.id === selectedEstateId);
  const year = new Date().getFullYear();

  return (
    <footer
      className={`mt-auto bg-gradient-to-br ${config.gradient} text-white`}
      aria-label="Application footer"
    >
      {/* Top divider accent */}
      <div className="h-px bg-white/10" />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + role identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <Home className="h-4 w-4 text-white" strokeWidth={2.2} />
                <span
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${config.accentDot}`}
                />
              </span>
              <span className="font-bold tracking-[0.08em] text-white">INKAHOME</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              {config.label}
            </p>
            <p className="max-w-xs text-sm leading-6 text-white/70">{config.tagline}</p>
            {selectedEstate && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5 text-white/60" />
                <span className="text-xs font-medium text-white/80">{selectedEstate.name}</span>
              </div>
            )}
          </div>

          {/* Quick navigation */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Quick Access
            </p>
            <ul className="space-y-2.5">
              {config.links.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center gap-2.5 text-sm text-white/70 transition-colors duration-150 hover:text-white"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Support
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${adminEmail}`}
                  className="group flex items-center gap-2.5 text-sm text-white/70 transition-colors duration-150 hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
                  Contact Administrator
                </a>
              </li>
              {role === "TENANT" && (
                <li>
                  <Link
                    to="/complaints/submit"
                    className="group flex items-center gap-2.5 text-sm text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
                    Report Maintenance Issue
                  </Link>
                </li>
              )}
              {(role === "CARETAKER" || role === "OWNER") && (
                <li>
                  <Link
                    to="/complaints"
                    className="group flex items-center gap-2.5 text-sm text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
                    All Complaints
                  </Link>
                </li>
              )}
              {role === "ADMIN" && (
                <li>
                  <Link
                    to="/admin/registrations"
                    className="group flex items-center gap-2.5 text-sm text-white/70 transition-colors duration-150 hover:text-white"
                  >
                    <Users className="h-3.5 w-3.5 shrink-0 text-white/40 transition-colors group-hover:text-white/80" />
                    Manage Registrations
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-start gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            © {year} INKAHOME · Estate Management Platform
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${config.accentDot} opacity-70`} />
            <p className="text-xs font-medium text-white/40">
              Signed in as{" "}
              <span className="text-white/60">{user?.email}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
