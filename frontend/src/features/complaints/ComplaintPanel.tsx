import type { ReactNode } from "react";
import type { Complaint } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const formatKes = (value: string | number | null) =>
  value === null ? "Not set" : `KES ${Number(value).toLocaleString()}`;

const statusVariantMap = {
  OPEN: "outline",
  CARETAKER_REVIEW: "warning",
  OWNER_APPROVED: "success",
  RESOLVED: "success",
} as const;

interface ComplaintPanelProps {
  complaint: Complaint;
  actions?: ReactNode;
  showEstate?: boolean;
}

export function ComplaintPanel({
  complaint,
  actions,
  showEstate = false,
}: ComplaintPanelProps) {
  const tenantName =
    `${complaint.tenancy.tenant.first_name} ${complaint.tenancy.tenant.last_name}`.trim();

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-slate-950">{complaint.house.name}</p>
              <Badge variant={statusVariantMap[complaint.status]}>{complaint.status.replace(/_/g, " ")}</Badge>
              <Badge variant={complaint.isDeductibleExpense ? "orange" : "outline"}>
                {complaint.isDeductibleExpense ? "Deductible" : "Non-deductible"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span>Tenant: {tenantName}</span>
              <span>Filed: {new Date(complaint.createdAt).toLocaleDateString()}</span>
              {showEstate ? <span>Estate: {complaint.estate.name}</span> : null}
            </div>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Estimated</p>
              <p className="mt-1 font-semibold text-slate-900">{formatKes(complaint.estimatedCost)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Approved</p>
              <p className="mt-1 font-semibold text-slate-900">{formatKes(complaint.approvedCost)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {complaint.description}
        </div>

        {(complaint.caretakerNotes || complaint.ownerNotes) && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Caretaker Notes</p>
              <p className="mt-2 text-slate-700">{complaint.caretakerNotes ?? "No caretaker notes yet."}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Owner Notes</p>
              <p className="mt-2 text-slate-700">{complaint.ownerNotes ?? "No owner notes yet."}</p>
            </div>
          </div>
        )}

        {actions ? <div className="border-t border-slate-200 pt-4">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
