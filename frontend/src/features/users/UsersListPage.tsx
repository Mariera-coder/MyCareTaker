import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createManagedUserSchema } from "@/lib/zodSchemas";
import {
  useActivateUserMutation,
  useCreateUserMutation,
  useDeactivateUserMutation,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
} from "@/features/users/usersApi";
import type { Role } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateManagedUserFormData = z.infer<typeof createManagedUserSchema>;
const roles: Role[] = ["ADMIN", "OWNER", "CARETAKER", "TENANT"];

export function UsersListPage() {
  const { data, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [activate, { isLoading: activating }] = useActivateUserMutation();
  const [deactivate, { isLoading: deactivating }] = useDeactivateUserMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateManagedUserFormData>({
    resolver: zodResolver(createManagedUserSchema),
    defaultValues: { role: "TENANT" },
  });
  const role = watch("role");

  const onSubmit = async (values: CreateManagedUserFormData) => {
    await createUser(values).unwrap();
    reset({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "TENANT",
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">User Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>Create User Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name ? <p className="text-xs text-red-600">{errors.first_name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name ? <p className="text-xs text-red-600">{errors.last_name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(value) => setValue("role", value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {isLoading ? <p>Loading users...</p> : null}
      <div className="grid gap-4">
        {data?.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{user.email}</span>
                <Badge variant={user.is_active ? "success" : "destructive"}>
                  {user.is_active ? "ACTIVE" : "DEACTIVATED"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p>
                {user.first_name} {user.last_name} | {user.role}
              </p>
              <div className="flex items-center gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value) => updateRole({ id: user.id, role: value as Role })}
                  disabled={updatingRole}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user.is_active ? (
                  <Button variant="destructive" disabled={deactivating} onClick={() => deactivate(user.id)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button disabled={activating} onClick={() => activate(user.id)}>
                    Activate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
