import { apiClient } from "@/lib/apiClient";
import type {
  EstateDashboard,
  EstatePaymentConfirmation,
  MonthlyReport,
  PendingPayment,
  TenantDashboard,
} from "@/lib/types";

export const paymentsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getTenantDashboard: builder.query<TenantDashboard, void>({
      query: () => "/payments/tenant/dashboard",
      providesTags: ["Reports", "Complaints"],
    }),
    submitTenantPayment: builder.mutation<
      unknown,
      { amount: number; weekNumber?: number; note?: string }
    >({
      query: (body) => ({
        url: "/payments/tenant",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Reports"],
    }),
    getEstateDashboard: builder.query<EstateDashboard, string>({
      query: (estateId) => `/payments/estate/${estateId}/dashboard`,
      providesTags: ["Reports"],
    }),
    getPendingPayments: builder.query<PendingPayment[], string>({
      query: (estateId) => `/payments/estate/${estateId}/pending`,
      providesTags: ["Reports"],
    }),
    getEstatePaymentConfirmations: builder.query<EstatePaymentConfirmation, string>({
      query: (estateId) => `/payments/estate/${estateId}/confirmations`,
      providesTags: ["Reports"],
    }),
    confirmPayment: builder.mutation<unknown, string>({
      query: (paymentId) => ({
        url: `/payments/${paymentId}/confirm`,
        method: "PATCH",
      }),
      invalidatesTags: ["Reports"],
    }),
    rejectPayment: builder.mutation<unknown, { paymentId: string; reason: string }>({
      query: ({ paymentId, reason }) => ({
        url: `/payments/${paymentId}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Reports"],
    }),
    getMonthlyReport: builder.query<MonthlyReport, { estateId: string; month: number; year: number }>({
      query: ({ estateId, month, year }) =>
        `/payments/estate/${estateId}/report?month=${month}&year=${year}`,
      providesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetTenantDashboardQuery,
  useSubmitTenantPaymentMutation,
  useGetEstateDashboardQuery,
  useGetPendingPaymentsQuery,
  useGetEstatePaymentConfirmationsQuery,
  useConfirmPaymentMutation,
  useRejectPaymentMutation,
  useGetMonthlyReportQuery,
} = paymentsApi;
