import { useAppSelector } from "@/app/hooks";
import { useGetComplaintsByEstateQuery, useGetComplaintsByTenantQuery } from "@/features/complaints/complaintsApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

      {complaints.map((complaint) => (
        <Card key={complaint.id}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{complaint.house.name}</CardTitle>
            <Badge
              variant={
                complaint.status === "OWNER_APPROVED"
                  ? "success"
                  : complaint.status === "CARETAKER_REVIEW"
                    ? "warning"
                    : complaint.status === "RESOLVED"
                      ? "success"
                      : "outline"
              }
            >
              {complaint.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{complaint.description}</p>
            <p>Tenant: {complaint.tenancy.tenant.first_name} {complaint.tenancy.tenant.last_name}</p>
            <p>Deductible: {complaint.isDeductibleExpense ? "Yes" : "No"}</p>
            <p>Estimated Cost: {complaint.estimatedCost ?? "-"}</p>
            <p>Approved Cost: {complaint.approvedCost ?? "-"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
