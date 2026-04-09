import { apiClient } from "@/lib/apiClient";
import type { Unit } from "@/lib/types";

export interface CreateUnitRequest {
  unit_number: string;
  estate_id: string;
  monthly_rent: number;
  description?: string;
}

export const unitsApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getUnitsByEstate: builder.query<Unit[], string>({
      query: (estateId) => `/units/estate/${estateId}`,
      providesTags: ["Units"],
    }),
    getUnitById: builder.query<Unit, string>({
      query: (id) => `/units/${id}`,
      providesTags: ["Units"],
    }),
    createUnit: builder.mutation<Unit, CreateUnitRequest>({
      query: (body) => ({
        url: "/units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Units"],
    }),
  }),
});

export const { useGetUnitsByEstateQuery, useCreateUnitMutation } = unitsApi;
