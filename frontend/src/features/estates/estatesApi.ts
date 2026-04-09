import { apiClient } from "@/lib/apiClient";
import type { Estate } from "@/lib/types";

export interface CreateEstateRequest {
  name: string;
  address: string;
  city: string;
  owner_user_id: string;
}

export interface AssignCaretakerRequest {
  estateId: string;
  user_id: string;
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
  }),
});

export const {
  useGetEstatesQuery,
  useGetEstateByIdQuery,
  useCreateEstateMutation,
  useAssignCaretakerMutation,
} = estatesApi;
