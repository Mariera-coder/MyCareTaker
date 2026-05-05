import { apiClient } from "@/lib/apiClient";
import type { MonthlyReport } from "@/lib/types";

export const reportsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getMonthlyReport: builder.query<MonthlyReport, { estateId: string; month: number; year: number }>({
      query: ({ estateId, month, year }) =>
        `/payments/estate/${estateId}/report?month=${month}&year=${year}`,
      providesTags: ["Reports"],
    }),
    issueCaretakerSalary: builder.mutation<
      { id: string; amount: number; message: string },
      { estateId: string; amount: number; month: number; year: number; note?: string }
    >({
      query: ({ estateId, ...body }) => ({
        url: `/payments/estate/${estateId}/caretaker-salaries`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reports"],
    }),
  }),
});

export const { useGetMonthlyReportQuery, useIssueCaretakerSalaryMutation } = reportsApi;
