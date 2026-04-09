import { apiClient } from "@/lib/apiClient";
import { clearAuth, setSession } from "@/features/auth/authSlice";
import type { AuthSession, AuthSessionResponse, AvailableHouse, PendingRegistration, PendingRegistrationRole } from "@/lib/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: PendingRegistrationRole;
  estateOfInterest?: string;
  message?: string;
}

export interface ApprovePendingRegistrationRequest {
  id: string;
  houseId?: string;
  estateIds?: string[];
  email?: string;
}

export const authApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthSessionResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setSession(data.session));
      },
    }),
    submitRegistration: builder.mutation<{ id: string; message: string }, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
    getSession: builder.query<AuthSession, void>({
      query: () => "/auth/session",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setSession(data));
        } catch {
          dispatch(clearAuth());
        }
      },
    }),
    getPendingRegistrations: builder.query<PendingRegistration[], void>({
      query: () => "/auth/pending-registrations",
      providesTags: ["PendingRegistrations"],
    }),
    getAvailableHouses: builder.query<AvailableHouse[], void>({
      query: () => "/auth/approval-options/houses",
    }),
    approvePendingRegistration: builder.mutation<
      { message: string; credentials: { email: string; password: string }; userId: string },
      ApprovePendingRegistrationRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/auth/pending-registrations/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingRegistrations", "Estates"],
    }),
    denyPendingRegistration: builder.mutation<{ message: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/auth/pending-registrations/${id}/deny`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PendingRegistrations"],
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearAuth());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useSubmitRegistrationMutation,
  useGetSessionQuery,
  useGetPendingRegistrationsQuery,
  useGetAvailableHousesQuery,
  useApprovePendingRegistrationMutation,
  useDenyPendingRegistrationMutation,
  useLogoutMutation,
} = authApi;
