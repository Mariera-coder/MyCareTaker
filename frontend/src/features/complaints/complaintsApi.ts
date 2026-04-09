import { apiClient } from "@/lib/apiClient";
import type { Complaint } from "@/lib/types";

export const complaintsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getComplaintsByEstate: builder.query<Complaint[], string>({
      query: (estateId) => `/complaints/estate/${estateId}`,
      providesTags: ["Complaints"],
    }),
    getComplaintsByTenant: builder.query<Complaint[], string>({
      query: (tenantId) => `/complaints/tenant/${tenantId}`,
      providesTags: ["Complaints"],
    }),
    createComplaint: builder.mutation<Complaint, { description: string; houseId?: string }>({
      query: (body) => ({
        url: "/complaints",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Complaints", "Reports"],
    }),
    caretakerReview: builder.mutation<
      Complaint,
      { id: string; body: { isDeductibleExpense?: boolean; estimatedCost?: number; caretakerNotes?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/complaints/${id}/caretaker-review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Complaints", "Reports"],
    }),
    ownerReview: builder.mutation<
      Complaint,
      { id: string; body: { decision: "APPROVED" | "REJECTED"; approvedCost?: number; ownerNotes?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/complaints/${id}/owner-review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Complaints", "Reports"],
    }),
  }),
});

export const {
  useGetComplaintsByEstateQuery,
  useGetComplaintsByTenantQuery,
  useCreateComplaintMutation,
  useCaretakerReviewMutation,
  useOwnerReviewMutation,
} = complaintsApi;
