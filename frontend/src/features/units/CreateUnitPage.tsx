import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createUnitSchema } from "@/lib/zodSchemas";
import { useCreateUnitMutation } from "@/features/units/unitsApi";
import { useGetEstatesQuery } from "@/features/estates/estatesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CreateUnitFormData = z.infer<typeof createUnitSchema>;

export function CreateUnitPage() {
  const navigate = useNavigate();
  const { data: estates } = useGetEstatesQuery();
  const [createUnit, { isLoading }] = useCreateUnitMutation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUnitFormData>({
    resolver: zodResolver(createUnitSchema),
  });

  const estateId = watch("estate_id");

  const onSubmit = async (values: CreateUnitFormData) => {
    await createUnit(values).unwrap();
    navigate(`/units?estateId=${values.estate_id}`);
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Create Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Estate</Label>
            <Select value={estateId} onValueChange={(value) => setValue("estate_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select estate" />
              </SelectTrigger>
              <SelectContent>
                {estates?.map((estate) => (
                  <SelectItem key={estate.id} value={estate.id}>
                    {estate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.estate_id ? <p className="text-xs text-red-600">{errors.estate_id.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_number">Unit Number</Label>
            <Input id="unit_number" {...register("unit_number")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_rent">Monthly Rent</Label>
            <Input id="monthly_rent" type="number" step="0.01" {...register("monthly_rent")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Unit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
