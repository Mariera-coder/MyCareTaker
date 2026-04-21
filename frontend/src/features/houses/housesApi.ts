import { apiClient } from "@/lib/apiClient";
import type { AvailableHouse } from "@/lib/types";

export const housesApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableHouses: builder.query<AvailableHouse[], void>({
      query: () => "/houses/available",
      providesTags: ["Estates"],
    }),
    getHousesByEstate: builder.query<AvailableHouse[], string>({
      query: (estateId) => `/houses/estate/${estateId}`,
      providesTags: ["Estates"],
    }),
    updateHouseRent: builder.mutation<AvailableHouse, { houseId: string; rentAmount: number }>({
      query: ({ houseId, rentAmount }) => ({
        url: `/houses/${houseId}/rent`,
        method: "PATCH",
        body: { rentAmount },
      }),
      invalidatesTags: ["Estates", "Reports"],
    }),
    updateHouseSecurityDeposit: builder.mutation<
      AvailableHouse,
      { houseId: string; securityDepositAmount: number }
    >({
      query: ({ houseId, securityDepositAmount }) => ({
        url: `/houses/${houseId}/security-deposit`,
        method: "PATCH",
        body: { securityDepositAmount },
      }),
      invalidatesTags: ["Estates", "Reports"],
    }),
    vacateTenant: builder.mutation<{ message: string }, { houseId: string }>({
      query: ({ houseId }) => ({
        url: `/houses/${houseId}/vacate`,
        method: "POST",
      }),
      invalidatesTags: ["Estates", "Reports", "Users"],
    }),
    manualRegisterTenant: builder.mutation<
      { message: string; credentials: { email: string; password: string }; userId: string },
      { fullName: string; phone: string; email?: string; houseId: string }
    >({
      query: (body) => ({
        url: "/houses/manual-register-tenant",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Estates", "Users"],
    }),
  }),
});

export const {
  useGetAvailableHousesQuery,
  useGetHousesByEstateQuery,
  useUpdateHouseRentMutation,
  useUpdateHouseSecurityDepositMutation,
  useVacateTenantMutation,
  useManualRegisterTenantMutation,
} = housesApi;
