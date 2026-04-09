import { useMemo, useState } from "react";
import { useGetEstatesQuery } from "@/features/estates/estatesApi";
import { useGetMonthlyReportQuery } from "@/features/reports/reportsApi";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MonthlyReportPage() {
  const now = new Date();
  const [estateId, setEstateId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const { data: estates } = useGetEstatesQuery();
  const { data, isFetching } = useGetMonthlyReportQuery(
    { estateId, month: Number(month), year: Number(year) },
    { skip: !estateId },
  );

  const years = useMemo(() => Array.from({ length: 7 }, (_, i) => String(now.getFullYear() - 3 + i)), [now]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Monthly Financial Report</h2>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Estate</Label>
            <Select value={estateId} onValueChange={setEstateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select estate" />
              </SelectTrigger>
              <SelectContent>
                {estates?.map((estate) => (
                  <SelectItem key={estate.id} value={estate.id}>
                    {estate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m}
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
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isFetching ? <p>Loading report...</p> : null}
      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Total Rent Collected" value={data.total_rent_collected.toLocaleString()} />
            <StatCard title="Total Deductions" value={data.total_deductions.toLocaleString()} />
            <StatCard title="Net Owner Payout" value={data.net_owner_payout.toLocaleString()} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Per-Unit Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Rent Collected</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.units.map((unit) => (
                    <TableRow key={unit.unit_id}>
                      <TableCell>{unit.unit_number}</TableCell>
                      <TableCell>{unit.monthly_rent.toLocaleString()}</TableCell>
                      <TableCell>{unit.rent_collected.toLocaleString()}</TableCell>
                      <TableCell>{unit.complaint_deductions.toLocaleString()}</TableCell>
                      <TableCell>{unit.net_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
