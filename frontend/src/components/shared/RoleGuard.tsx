import type { PropsWithChildren } from "react";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/lib/types";

interface RoleGuardProps extends PropsWithChildren {
  allow: Role[];
}

export function RoleGuard({ allow, children }: RoleGuardProps) {
  const role = useAppSelector((state) => state.auth.user?.role);
  if (!role || !allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
