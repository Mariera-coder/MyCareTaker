import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  useConfirmPaymentMutation,
  useGetEstatePaymentConfirmationsQuery,
  useRejectPaymentMutation,
} from "@/features/payments/paymentsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formatKes = (value: number) => `KES ${value.toLocaleString()}`;

export function ApprovedRentConfirmationPage() {
  const { user, selectedEstateId, availableEstates } = useAppSelector((state) => state.auth);
  const estateId = selectedEstateId ?? "";
  const { data } = useGetEstatePaymentConfirmationsQuery(estateId, {
    skip: !estateId || !user || !["CARETAKER", "OWNER"].includes(user.role),
  });
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [confirmPayment, { isLoading: confirmingPayment }] = useConfirmPaymentMutation();
  const [rejectPayment, { isLoading: rejectingPayment }] = useRejectPaymentMutation();

  const selectedEstate = useMemo(
    () => availableEstates.find((estate) => estate.id === estateId) ?? null,
    [availableEstates, estateId],
  );
  const selectedTenant =
    data?.tenants.find((tenant) => tenant.tenancyId === selectedTenancyId) ?? data?.tenants[0] ?? null;

  if (!user) {
    return null;
  }

  if (!["CARETAKER", "OWNER"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!estateId) {
    return <Navigate to="/select-estate" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Approved Rent Confirmation{selectedEstate ? ` · ${selectedEstate.name}` : ""}
        </h1>
        <p className="text-sm text-slate-600">
          {user.role === "CARETAKER"
            ? "Review pending payments and open each tenant's receipt history in one place."
            : "Read-only rent confirmation history for the selected estate, including former and disabled tenants."}
        </p>
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <CardTitle>{user.role === "CARETAKER" ? "Awaiting Confirmation" : "Pending Payments"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(data?.pendingPayments ?? []).length === 0 ? (
            <p className="text-sm text-slate-600">No pending rent payments right now.</p>
          ) : (
            (data?.pendingPayments ?? []).map((payment) => (
              <div key={payment.id} className="rounded-xl border border-slate-200 p-4">
                <div className="grid gap-2 md:grid-cols-6">
                  <p className="font-medium text-slate-900">{payment.tenantName}</p>
                  <p>{payment.houseName}</p>
                  <p>{formatKes(payment.amountClaimed)}</p>
                  <p>{payment.cycleLabel}</p>
                  <p>{payment.paymentType}</p>
                  <p>{new Date(payment.dateSubmitted).toLocaleString()}</p>
                </div>
                <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Phone: {payment.tenantPhone ?? "No phone provided"}</p>
                  <p>Email: {payment.tenantEmail ?? "No email provided"}</p>
                  {payment.note ? <p className="md:col-span-2">Note: {payment.note}</p> : null}
                </div>
                {user.role === "CARETAKER" ? (
                  <div className="mt-3 flex gap-3">
                    <Button disabled={confirmingPayment} onClick={() => confirmPayment(payment.id)}>
                      Confirm
                    </Button>
                    <Input
                      placeholder="Reject reason"
                      value={rejectReason[payment.id] ?? ""}
                      onChange={(event) =>
                        setRejectReason((current) => ({ ...current, [payment.id]: event.target.value }))
                      }
                    />
                    <Button
                      variant="destructive"
                      disabled={rejectingPayment || !rejectReason[payment.id]}
                      onClick={() => rejectPayment({ paymentId: payment.id, reason: rejectReason[payment.id] })}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.tenants ?? []).map((tenant) => (
              <button
                key={tenant.tenancyId}
                type="button"
                onClick={() => setSelectedTenancyId(tenant.tenancyId)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  (selectedTenant?.tenancyId ?? data?.tenants?.[0]?.tenancyId) === tenant.tenancyId
                    ? "border-sky-300 bg-sky-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{tenant.tenantName}</p>
                  <div className="flex flex-wrap gap-2">
                    {!tenant.isActive ? <Badge variant="warning">Former</Badge> : <Badge variant="success">Active</Badge>}
                    {!tenant.tenantIsActive ? <Badge variant="destructive">Disabled</Badge> : null}
                  </div>
                </div>
                <p className="text-sm text-slate-600">{tenant.houseName}</p>
                {tenant.tenancyEndDate ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Vacated on {new Date(tenant.tenancyEndDate).toLocaleDateString()}
                  </p>
                ) : null}
                {tenant.creditBalance > 0 ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    Credit available: {formatKes(tenant.creditBalance)}
                  </p>
                ) : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle>{selectedTenant ? `${selectedTenant.tenantName} Receipts` : "Receipts"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTenant ? (
              <>
                <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
                  <p>House: {selectedTenant.houseName}</p>
                  <p>Phone: {selectedTenant.tenantPhone ?? "No phone provided"}</p>
                  <p className="md:col-span-2">Email: {selectedTenant.tenantEmail ?? "No email provided"}</p>
                  <p>Status: {selectedTenant.isActive ? "Active tenancy" : "Former tenancy"}</p>
                  <p>Account: {selectedTenant.tenantIsActive ? "Enabled" : "Disabled"}</p>
                </div>

                {selectedTenant.receipts.length === 0 ? (
                  <p className="text-sm text-slate-600">No confirmed receipts recorded for this tenant yet.</p>
                ) : (
                  selectedTenant.receipts.map((receipt) => (
                    <div key={receipt.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="grid gap-2 md:grid-cols-4">
                        <p className="font-medium text-slate-900">{formatKes(receipt.amount)}</p>
                        <p>{receipt.cycleLabel}</p>
                        <p>{receipt.paymentType}</p>
                        <p>{new Date(receipt.paymentDate).toLocaleString()}</p>
                      </div>
                      <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p>Confirmed: {receipt.confirmedAt ? new Date(receipt.confirmedAt).toLocaleString() : "Not confirmed"}</p>
                        <p>Note: {receipt.note ?? "No note"}</p>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <p className="text-sm text-slate-600">No tenants have been recorded for this estate yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
