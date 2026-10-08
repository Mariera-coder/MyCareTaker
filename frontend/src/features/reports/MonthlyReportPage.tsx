import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetMonthlyReportQuery, useIssueCaretakerSalaryMutation } from "@/features/reports/reportsApi";

const formatKes = (value: number) => `KES ${value.toLocaleString()}`;

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function CollectionsChart({
  data,
  selectedMonth,
}: {
  data: Array<{
    month: number;
    month_label: string;
    total_rent_collected: number;
  }>;
  selectedMonth: number;
}) {
  const maxValue = Math.max(...data.map((item) => item.total_rent_collected), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div className="flex h-72 min-w-[560px] md:min-w-0 items-end gap-2 rounded-3xl bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_60%)] p-4">
          {data.map((item) => {
            const height = maxValue === 0 ? 12 : Math.max((item.total_rent_collected / maxValue) * 100, 12);
            const isSelected = item.month === selectedMonth;

            return (
              <div key={item.month} className="flex flex-1 flex-col items-center justify-end gap-3">
                <span className={`text-center text-[11px] font-semibold ${isSelected ? "text-sky-700" : "text-slate-500"}`}>
                  {formatKes(item.total_rent_collected)}
                </span>
                <div
                  className={`w-full rounded-t-2xl transition-all ${
                    isSelected ? "bg-[linear-gradient(180deg,#0f766e_0%,#0ea5e9_100%)]" : "bg-[linear-gradient(180deg,#94a3b8_0%,#cbd5e1_100%)]"
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className={`text-xs font-semibold ${isSelected ? "text-slate-900" : "text-slate-500"}`}>{item.month_label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-sm text-slate-600">
        The highlighted bar is the month currently selected in the report filter.
      </p>
    </div>
  );
}

export function MonthlyReportPage() {
  const now = new Date();
  const { user, availableEstates, selectedEstateId } = useAppSelector((state) => state.auth);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [salaryDraft, setSalaryDraft] = useState("");
  const [salaryNote, setSalaryNote] = useState("");
  const [issueCaretakerSalary, { isLoading: issuingSalary }] = useIssueCaretakerSalaryMutation();
  const { data, error, isFetching } = useGetMonthlyReportQuery(
    { estateId: selectedEstateId ?? "", month: Number(month), year: Number(year) },
    { skip: !selectedEstateId },
  );

  const selectedEstateName = useMemo(
    () => availableEstates.find((estate) => estate.id === selectedEstateId)?.name ?? null,
    [availableEstates, selectedEstateId],
  );

  const years = useMemo(() => Array.from({ length: 7 }, (_, i) => String(now.getFullYear() - 3 + i)), [now]);

  const selectedMonthSummary = useMemo(
    () => data?.monthly_collections.find((item) => item.month === Number(month)) ?? null,
    [data, month],
  );

  const yearlyTotals = useMemo(
    () =>
      data?.monthly_collections.reduce(
        (acc, item) => {
          acc.total_rent_collected += item.total_rent_collected;
          acc.total_deductions += item.total_deductions;
          acc.net_owner_payout += item.net_owner_payout;
          return acc;
        },
        { total_rent_collected: 0, total_deductions: 0, net_owner_payout: 0 },
      ) ?? { total_rent_collected: 0, total_deductions: 0, net_owner_payout: 0 },
    [data],
  );

  if (!user) {
    return null;
  }

  if (!["CARETAKER", "OWNER"].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!selectedEstateId) {
    return <Navigate to="/select-estate" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Monthly Financial Report</h2>
            <Badge variant="outline">{selectedEstateName ?? "Selected Estate"}</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Review the selected month, then compare total collections across the full year for this estate.
          </p>
        </div>
        {availableEstates.length > 1 ? (
          <Button asChild variant="outline">
            <Link to="/select-estate">Switch Estate</Link>
          </Button>
        ) : null}
      </div>

      <div className={`grid gap-4 ${user.role === "OWNER" ? "xl:grid-cols-[1.2fr_0.8fr]" : ""}`}>
        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle>Report Period</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {user.role === "OWNER" ? (
          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Issue Caretaker Salary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salaryDraft}
                  onChange={(event) => setSalaryDraft(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Input
                  value={salaryNote}
                  onChange={(event) => setSalaryNote(event.target.value)}
                  placeholder="Optional payment note"
                />
              </div>
              <Button
                disabled={issuingSalary || Number(salaryDraft || 0) <= 0}
                onClick={async () => {
                  await issueCaretakerSalary({
                    estateId: selectedEstateId,
                    amount: Number(salaryDraft || 0),
                    month: Number(month),
                    year: Number(year),
                    note: salaryNote || undefined,
                  }).unwrap();
                  setSalaryDraft("");
                  setSalaryNote("");
                }}
              >
                {issuingSalary ? "Recording..." : "Record Salary Payment"}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {isFetching ? <p className="text-sm text-slate-600">Loading report...</p> : null}
      {error ? (
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">
            The monthly report could not be loaded for this estate and period. Please confirm the estate selection and month filter, then try again.
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Total Rent Collected" value={formatKes(data.total_rent_collected)} backgroundColor="bg-[#0f766e]" />
            <StatCard title="Complaint Deductions" value={formatKes(data.complaint_deductions_total)} backgroundColor="bg-[#b45309]" />
            <StatCard title="Caretaker Salary Paid" value={formatKes(data.caretaker_salary_deduction)} backgroundColor="bg-[#475569]" />
            <StatCard title="Net Owner Payout" value={formatKes(data.net_owner_payout)} backgroundColor="bg-[#1d4ed8]" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle>Yearly Collections Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <CollectionsChart data={data.monthly_collections} selectedMonth={Number(month)} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200">
              <CardHeader>
                <CardTitle>Year Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Selected Month</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {selectedMonthSummary?.month_label ?? MONTH_OPTIONS[Number(month) - 1]?.label ?? month} {year}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Yearly Collections</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(yearlyTotals.total_rent_collected)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Yearly Deductions</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(yearlyTotals.total_deductions)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Yearly Net Payout</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(yearlyTotals.net_owner_payout)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Monthly Stats Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Collected</TableHead>
                    <TableHead>Complaint Deductions</TableHead>
                    <TableHead>Caretaker Salary Paid</TableHead>
                    <TableHead>Total Deductions</TableHead>
                    <TableHead>Net Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.monthly_collections.map((item) => (
                    <TableRow key={item.month} className={item.month === Number(month) ? "bg-sky-50" : undefined}>
                      <TableCell className="font-medium text-slate-900">{item.month_label} {year}</TableCell>
                      <TableCell>{formatKes(item.total_rent_collected)}</TableCell>
                      <TableCell>{formatKes(item.complaint_deductions_total)}</TableCell>
                      <TableCell>{formatKes(item.caretaker_salary_deduction)}</TableCell>
                      <TableCell>{formatKes(item.total_deductions)}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{formatKes(item.net_owner_payout)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </div>
              </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Selected Month Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Complaint Deductions</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(data.complaint_deductions_total)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Caretaker Salary Paid</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(data.caretaker_salary_deduction)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total Deductions</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatKes(data.total_deductions)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Caretaker Salary Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paid At</TableHead>
                    <TableHead>Caretaker</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.salary_payments.length ? (
                    data.salary_payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paid_at).toLocaleString()}</TableCell>
                        <TableCell>{payment.caretaker_name ?? "Assigned caretaker"}</TableCell>
                        <TableCell>{payment.paid_by_name ?? "Owner"}</TableCell>
                        <TableCell>{payment.note ?? "No note"}</TableCell>
                        <TableCell className="font-semibold text-slate-900">{formatKes(payment.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        No caretaker salary payments have been recorded for the selected month.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
                </div>
              </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader>
              <CardTitle>Per-Unit Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Rent Collected</TableHead>
                    <TableHead>Complaint Deductions</TableHead>
                    <TableHead>Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.units.length ? (
                    data.units.map((unit) => {
                      const showFormerTenant = unit.tenant_name && (!unit.tenant_is_active || unit.tenancy_is_active === false);

                      return (
                        <TableRow key={unit.unit_id} className={showFormerTenant ? "bg-amber-50/80" : undefined}>
                          <TableCell className="font-medium text-slate-900">{unit.unit_number}</TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <p className="font-medium text-slate-900">{unit.tenant_name ?? "Vacant"}</p>
                              {unit.tenant_name ? (
                                <div className="flex flex-wrap gap-2">
                                  {showFormerTenant ? <Badge variant="warning">Former Tenant</Badge> : <Badge variant="success">Active Tenant</Badge>}
                                  {!unit.tenant_is_active ? <Badge variant="destructive">Account Disabled</Badge> : null}
                                </div>
                              ) : (
                                <Badge variant="outline">No tenant</Badge>
                              )}
                              {unit.tenancy_end_date ? (
                                <p className="text-xs text-slate-500">
                                  Vacated on {new Date(unit.tenancy_end_date).toLocaleDateString()}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatKes(unit.monthly_rent)}</TableCell>
                          <TableCell>{formatKes(unit.rent_collected)}</TableCell>
                          <TableCell>{formatKes(unit.complaint_deductions)}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{formatKes(unit.net_amount)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No unit records were found for this estate in the selected month.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
                </div>
              </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
