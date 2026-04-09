import { apiClient } from "@/lib/apiClient";
import type { AuthUser, Role } from "@/lib/types";

export interface UserListItem extends AuthUser {
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: Role;
}

export const usersApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserListItem[], Role | void>({
      query: (role) => (role ? `/users?role=${role}` : "/users"),
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<UserListItem, CreateUserRequest>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),
    deactivateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
    activateUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
    updateUserRole: builder.mutation<UserListItem, { id: string; role: Role }>({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useUpdateUserRoleMutation,
} = usersApi;
