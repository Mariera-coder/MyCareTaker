import { apiClient } from "@/lib/apiClient";
import type { Estate } from "@/lib/types";

export interface CreateEstateRequest {
  name: string;
  address: string;
  city: string;
  owner_user_id: string;
}

export interface UpdateEstateFinancialSettingsRequest {
  estateId: string;
  monthlyCaretakerDeduction: number;
}

export interface EstateFinancialSettingsResponse {
  message: string;
  monthlyCaretakerDeduction: number;
}

export interface AssignCaretakerRequest {
  estateId: string;
  user_id: string;
}

export interface ReplaceCaretakerRequest {
  estateId: string;
  outgoing_user_id: string;
  incoming_user_id: string;
  deactivateOutgoing?: boolean;
}

export const estatesApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getEstates: builder.query<Estate[], void>({
      query: () => "/estates",
      providesTags: ["Estates"],
    }),
    getEstateById: builder.query<Estate, string>({
      query: (id) => `/estates/${id}`,
      providesTags: ["Estates"],
    }),
    createEstate: builder.mutation<Estate, CreateEstateRequest>({
      query: (body) => ({
        url: "/estates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Estates"],
    }),
    assignCaretaker: builder.mutation<{ message: string }, AssignCaretakerRequest>({
      query: ({ estateId, user_id }) => ({
        url: `/estates/${estateId}/caretakers`,
        method: "POST",
        body: { user_id },
      }),
      invalidatesTags: ["Estates"],
    }),
    replaceCaretaker: builder.mutation<{ message: string }, ReplaceCaretakerRequest>({
      query: ({ estateId, ...body }) => ({
        url: `/estates/${estateId}/caretakers/replace`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Estates", "Users", "Reports"],
    }),
    updateEstateFinancialSettings: builder.mutation<EstateFinancialSettingsResponse, UpdateEstateFinancialSettingsRequest>({
      query: ({ estateId, monthlyCaretakerDeduction }) => ({
        url: `/estates/${estateId}/financial-settings`,
        method: "PATCH",
        body: { monthlyCaretakerDeduction },
      }),
      invalidatesTags: ["Estates", "Reports"],
    }),
  }),
});

export const {
  useGetEstatesQuery,
  useGetEstateByIdQuery,
  useCreateEstateMutation,
  useAssignCaretakerMutation,
  useReplaceCaretakerMutation,
  useUpdateEstateFinancialSettingsMutation,
} = estatesApi;
