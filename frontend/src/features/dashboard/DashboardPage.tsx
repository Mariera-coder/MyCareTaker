import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import {
  useConfirmPaymentMutation,
  useGetEstateDashboardQuery,
  useGetMonthlyReportQuery,
  useGetPendingPaymentsQuery,
  useGetTenantDashboardQuery,
  useRejectPaymentMutation,
  useSubmitTenantPaymentMutation,
} from "@/features/payments/paymentsApi";
import { useGetComplaintsByEstateQuery } from "@/features/complaints/complaintsApi";
import { DataTable, StatusPill } from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formatKes = (value: number) => `KES ${value.toLocaleString()}`;

function DashboardHeader({ title, estateName }: { title: string; estateName?: string | null }) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
        {estateName ? ` · ${estateName}` : ""}
      </h1>
      <p className="text-sm text-slate-600">{estateName ?? "MyCareTaker workspace"}</p>
    </div>
  );
}

export function DashboardPage() {
  const { user, tenantContext, availableEstates, selectedEstateId } = useAppSelector((state) => state.auth);
  const activeEstateId = user?.role === "TENANT" ? tenantContext?.estate.id ?? "" : selectedEstateId ?? "";

  const tenantDashboard = useGetTenantDashboardQuery(undefined, {
    skip: user?.role !== "TENANT",
  });
  const estateDashboard = useGetEstateDashboardQuery(activeEstateId, {
    skip: !activeEstateId || !user || !["CARETAKER", "OWNER"].includes(user.role),
  });
  const pendingPayments = useGetPendingPaymentsQuery(activeEstateId, {
    skip: !activeEstateId || user?.role !== "CARETAKER",
  });
  const complaints = useGetComplaintsByEstateQuery(activeEstateId, {
    skip: !activeEstateId || !user || !["CARETAKER", "OWNER"].includes(user.role),
  });

  const now = new Date();
  const monthlyReport = useGetMonthlyReportQuery(
    { estateId: activeEstateId, month: now.getMonth() + 1, year: now.getFullYear() },
    { skip: !activeEstateId || !user || !["CARETAKER", "OWNER"].includes(user.role) },
  );

  const [submitPayment, { isLoading: submittingPayment }] = useSubmitTenantPaymentMutation();
  const [confirmPayment, { isLoading: confirmingPayment }] = useConfirmPaymentMutation();
  const [rejectPayment, { isLoading: rejectingPayment }] = useRejectPaymentMutation();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentWeek, setPaymentWeek] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const selectedEstate = useMemo(
    () => availableEstates.find((estate) => estate.id === activeEstateId) ?? null,
    [availableEstates, activeEstateId],
  );

  if (!user) {
    return null;
  }

  if (["CARETAKER", "OWNER"].includes(user.role) && !activeEstateId) {
    return <Navigate to="/select-estate" replace />;
  }

  if (user.role === "TENANT") {
    const dashboard = tenantDashboard.data;
    if (!dashboard) {
      return null;
    }

    const highlightedLabel =
      paymentWeek !== null
        ? `Pay Week ${paymentWeek} installment - ${formatKes(dashboard.planner[paymentWeek - 1]?.targetAmount ?? 0)}`
        : "Enter the amount you are paying";

    const currentAmount = paymentWeek
      ? dashboard.planner[paymentWeek - 1]?.targetAmount ?? 0
      : Number(paymentAmount || 0);

    const actionLabel =
      paymentWeek !== null
        ? "Mark Installment as Completed"
        : currentAmount >= dashboard.summary.monthlyRentDue
          ? "Mark Full Payment as Completed"
          : "Mark Partial Payment as Completed";

    return (
      <div className="space-y-6">
        <DashboardHeader title="Tenant Dashboard" estateName={dashboard.tenancy.estate.name} />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Monthly Rent Due" value={formatKes(dashboard.summary.monthlyRentDue)} backgroundColor="bg-[#1d4ed8]" />
          <StatCard title="Amount Paid This Month" value={formatKes(dashboard.summary.amountPaidThisMonth)} backgroundColor="bg-[#15803d]" />
          <StatCard
            title="Outstanding Balance"
            value={formatKes(dashboard.summary.outstandingBalance)}
            backgroundColor={dashboard.summary.outstandingBalance > 0 ? "bg-[#b91c1c]" : "bg-[#15803d]"}
          />
        </div>

        {dashboard.previousMonthStatus ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              dashboard.previousMonthStatus.deficit > 0
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {dashboard.previousMonthStatus.deficit > 0
              ? `Previous month deficit: ${formatKes(dashboard.previousMonthStatus.deficit)} - carried forward to this month`
              : "Previous month: Fully paid"}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" type="button">Export CSV</Button>
            <Button variant="outline" type="button">Send & Notify</Button>
          </div>
          <DataTable
            columns={[
              { key: "month", header: "Month", render: (row) => row.monthYear },
              { key: "due", header: "Rent Due (KES)", render: (row) => formatKes(row.amountDue) },
              { key: "paid", header: "Paid (KES)", render: (row) => formatKes(row.amountPaid) },
              {
                key: "deficit",
                header: "Deficit (KES)",
                className: "font-semibold",
                render: (row) => (
                  <span className={row.deficit > 0 ? "font-bold text-[#b91c1c]" : "text-[#15803d]"}>
                    {formatKes(row.deficit)}
                  </span>
                ),
              },
              { key: "status", header: "Status", render: (row) => <StatusPill status={row.status} /> },
              {
                key: "action",
                header: "Action",
                render: (row) => row.pendingConfirmation ? <Badge variant="warning">Pending confirmation</Badge> : "-",
              },
            ]}
            rows={dashboard.rentRecords}
          />
        </div>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle>Rent Budget Planner</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {dashboard.planner.map((week) => (
              <div key={week.weekNumber} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Week {week.weekNumber}</p>
                <p className="mt-2 text-sm text-slate-600">Target {formatKes(week.targetAmount)}</p>
                <p className="text-sm text-slate-600">Confirmed {formatKes(week.confirmedPaid)}</p>
                <p className="text-sm text-slate-600">Remaining {formatKes(week.remaining)}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-sky-600" style={{ width: `${week.progress}%` }} />
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => {
                    setPaymentWeek(week.weekNumber);
                    setPaymentAmount(String(week.targetAmount));
                  }}
                >
                  Use Week {week.weekNumber}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle>Make Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Option A</p>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentWeek === null ? paymentAmount : ""}
                  onChange={(event) => {
                    setPaymentWeek(null);
                    setPaymentAmount(event.target.value);
                  }}
                  placeholder="Enter the amount you are paying"
                />
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">{highlightedLabel}</p>
                {dashboard.paymentInstructions ? (
                  <p className="mt-2">
                    To complete payment, send money to {dashboard.paymentInstructions.caretakerName}:{" "}
                    {dashboard.paymentInstructions.caretakerPhoneNumber ?? "No phone provided"}
                  </p>
                ) : (
                  <p className="mt-2">Caretaker instructions are not available yet.</p>
                )}
              </div>
            </div>
            <Button
              disabled={submittingPayment || currentAmount <= 0}
              onClick={async () => {
                await submitPayment({
                  amount: currentAmount,
                  weekNumber: paymentWeek ?? undefined,
                }).unwrap();
                setPaymentAmount("");
                setPaymentWeek(null);
              }}
            >
              {submittingPayment ? "Submitting..." : actionLabel}
            </Button>
            <p className="text-sm text-slate-600">
              Payment submitted - awaiting your caretaker confirmation. Your dashboard will update once confirmed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === "CARETAKER" || user.role === "OWNER") {
    const dashboard = estateDashboard.data;
    if (!dashboard) {
      return null;
    }

    const report = monthlyReport.data;

    return (
      <div className="space-y-6">
        <DashboardHeader
          title={user.role === "CARETAKER" ? "Caretaker Dashboard" : "Owner Dashboard"}
          estateName={selectedEstate?.name}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Rent Expected" value={formatKes(dashboard.stats.totalRentExpected)} backgroundColor="bg-[#1d4ed8]" />
          <StatCard title="Total Collected This Month" value={formatKes(dashboard.stats.totalCollected)} backgroundColor="bg-[#15803d]" />
          <StatCard title="Total Deficit This Month" value={formatKes(dashboard.stats.totalDeficit)} backgroundColor="bg-[#b91c1c]" />
          <StatCard
            title={user.role === "CARETAKER" ? "Awaiting Confirmation" : "Total Approved Deductible Expenses"}
            value={user.role === "CARETAKER" ? dashboard.stats.awaitingConfirmation : formatKes(dashboard.stats.totalApprovedDeductibleExpenses)}
            backgroundColor="bg-[#b45309]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" type="button">Export CSV</Button>
            <Button variant="outline" type="button">Send & Notify</Button>
          </div>
          <DataTable
            columns={[
              { key: "house", header: "House Name", render: (row) => row.houseName },
              { key: "tenant", header: "Tenant Name", render: (row) => row.tenantName },
              { key: "rent", header: "Monthly Rent (KES)", render: (row) => formatKes(row.monthlyRent) },
              { key: "paid", header: "Paid (KES)", render: (row) => formatKes(row.paid) },
              {
                key: "deficit",
                header: "Deficit (KES)",
                render: (row) => (
                  <span className={row.deficit > 0 ? "font-bold text-[#b91c1c]" : "text-[#15803d]"}>
                    {formatKes(row.deficit)}
                  </span>
                ),
              },
              { key: "prev", header: "Prev Month Status", render: (row) => row.prevMonthStatus },
            ]}
            rows={dashboard.rows}
            footer={
              <div className="grid gap-2 md:grid-cols-3">
                <span>Total Expected: {formatKes(dashboard.stats.totalRentExpected)}</span>
                <span>Total Collected: {formatKes(dashboard.stats.totalCollected)}</span>
                <span>Total Deficit: {formatKes(dashboard.stats.totalDeficit)}</span>
              </div>
            }
          />
        </div>

        {user.role === "CARETAKER" ? (
          <Card className="rounded-xl border-slate-200">
            <CardHeader>
              <CardTitle>Awaiting Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(pendingPayments.data ?? []).map((payment) => (
                <div key={payment.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-2 md:grid-cols-5">
                    <p>{payment.houseName}</p>
                    <p>{payment.tenantName}</p>
                    <p>{formatKes(payment.amountClaimed)}</p>
                    <p>{payment.paymentType}</p>
                    <p>{new Date(payment.dateSubmitted).toLocaleString()}</p>
                  </div>
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
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle>Monthly Reports</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p>Total collected: {formatKes(report?.total_rent_collected ?? 0)}</p>
            <p>Total deductions: {formatKes(report?.total_deductions ?? 0)}</p>
            <p>Net payout: {formatKes(report?.net_owner_payout ?? 0)}</p>
            <p>Complaints in queue: {complaints.data?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Administrator Panel" estateName={null} />
      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-6 text-sm text-slate-600">
          Use the pending registrations and house administration tools to manage allocations, rent, and vacates.
        </CardContent>
      </Card>
    </div>
  );
}
