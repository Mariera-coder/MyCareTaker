import { Link } from "react-router-dom";
import { Home, Mail, LogIn, UserPlus } from "lucide-react";

const adminEmail = "marieramichael01@gmail.com";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[#e5dfd6] bg-[#f6f4ef] text-[#2f2a24]"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#101820] text-white shadow-sm">
                <Home className="h-4 w-4" strokeWidth={2.2} />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f2b84b]" />
              </span>
              <span className="font-bold tracking-[0.08em] text-[#101820]">INKAHOME</span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#5f564d]">
              A composed platform for estate owners, caretakers, and tenants to manage property operations with clarity.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b9488]">
              Get Started
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="group flex items-center gap-2.5 text-sm text-[#5f564d] transition-colors hover:text-[#101820]"
                >
                  <LogIn className="h-3.5 w-3.5 shrink-0 text-[#9b9488] transition-colors group-hover:text-[#2f2a24]" />
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register?role=TENANT"
                  className="group flex items-center gap-2.5 text-sm text-[#5f564d] transition-colors hover:text-[#101820]"
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0 text-[#9b9488] transition-colors group-hover:text-[#2f2a24]" />
                  Register as Tenant
                </Link>
              </li>
              <li>
                <Link
                  to="/register?role=OWNER"
                  className="group flex items-center gap-2.5 text-sm text-[#5f564d] transition-colors hover:text-[#101820]"
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0 text-[#9b9488] transition-colors group-hover:text-[#2f2a24]" />
                  Register as Owner
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b9488]">
              Contact
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${adminEmail}`}
                  className="group flex items-center gap-2.5 text-sm text-[#5f564d] transition-colors hover:text-[#101820]"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[#9b9488] transition-colors group-hover:text-[#2f2a24]" />
                  Administrator Help
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 flex flex-col items-start gap-2 border-t border-[#e0d9d0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#9b9488]">
            © {year} INKAHOME · Estate Management Platform
          </p>
          <p className="text-xs text-[#b5ae9f]">Built for owners, caretakers, and tenants.</p>
        </div>
      </div>
    </footer>
  );
}
