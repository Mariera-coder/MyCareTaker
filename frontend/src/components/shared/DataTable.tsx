import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  footer?: ReactNode;
}

export function DataTable<T>({ columns, rows, footer }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-[#1b3a5c]">
          <TableRow className="border-none hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className="h-auto border border-[#31506d] bg-[#1b3a5c] px-3 py-3 text-sm font-semibold text-white">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              className={index % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-[#f8fafc] hover:bg-slate-100"}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={`border border-slate-200 px-3 py-3 ${column.className ?? ""}`}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {footer ? (
            <TableRow className="bg-[#f1f5f9] font-semibold hover:bg-[#f1f5f9]">
              <TableCell colSpan={columns.length} className="border border-slate-200 px-3 py-3">
                {footer}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const variant =
    status === "PAID"
      ? "success"
      : status === "PARTIAL"
        ? "warning"
        : status === "CARRIED_FORWARD"
          ? "destructive"
          : "outline";

  return <Badge variant={variant}>{status}</Badge>;
}
