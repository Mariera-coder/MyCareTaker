import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createEstateSchema } from "@/lib/zodSchemas";
import { useCreateEstateMutation } from "@/features/estates/estatesApi";
import { useGetUsersQuery } from "@/features/users/usersApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateEstateFormData = z.infer<typeof createEstateSchema>;

export function CreateEstatePage() {
  const navigate = useNavigate();
  const [createEstate, { isLoading }] = useCreateEstateMutation();
  const { data: owners, isLoading: loadingOwners } = useGetUsersQuery("OWNER");
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEstateFormData>({
    resolver: zodResolver(createEstateSchema),
  });
  const ownerUserId = watch("owner_user_id");

  const onSubmit = async (values: CreateEstateFormData) => {
    const estate = await createEstate(values).unwrap();
    navigate(`/estates/${estate.id}`);
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create Estate</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Estate Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            {errors.address ? <p className="text-xs text-red-600">{errors.address.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            {errors.city ? <p className="text-xs text-red-600">{errors.city.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Owner</Label>
            <Select value={ownerUserId} onValueChange={(value) => setValue("owner_user_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder={loadingOwners ? "Loading owners..." : "Select owner"} />
              </SelectTrigger>
              <SelectContent>
                {owners?.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.first_name} {owner.last_name} ({owner.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.owner_user_id ? <p className="text-xs text-red-600">{errors.owner_user_id.message}</p> : null}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Estate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
