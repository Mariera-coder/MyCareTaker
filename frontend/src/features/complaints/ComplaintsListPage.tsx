import { useAppSelector } from "@/app/hooks";
import { useGetComplaintsByEstateQuery, useGetComplaintsByTenantQuery } from "@/features/complaints/complaintsApi";
import { ComplaintPanel } from "@/features/complaints/ComplaintPanel";

export function ComplaintsListPage() {
  const { user, tenantContext, selectedEstateId } = useAppSelector((state) => state.auth);
  const tenantQuery = useGetComplaintsByTenantQuery(user?.id ?? "", {
    skip: user?.role !== "TENANT" || !user?.id,
  });
  const estateQuery = useGetComplaintsByEstateQuery(selectedEstateId ?? "", {
    skip: !selectedEstateId || user?.role === "TENANT",
  });

  const complaints = user?.role === "TENANT" ? tenantQuery.data ?? [] : estateQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Complaints</h2>
        <p className="text-sm text-slate-600">
          {user?.role === "TENANT"
            ? `${tenantContext?.estate.name} · ${tenantContext?.house.name}`
            : "Estate-scoped complaint list"}
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No complaints have been recorded for this view yet.
        </div>
      ) : (
        complaints.map((complaint) => (
          <ComplaintPanel key={complaint.id} complaint={complaint} showEstate={user?.role !== "TENANT"} />
        ))
      )}
    </div>
  );
}
