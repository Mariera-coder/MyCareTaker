import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { useCreateComplaintMutation } from "@/features/complaints/complaintsApi";
import { useGetHousesByEstateQuery } from "@/features/houses/housesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth.user?.role);
  const estateId = useAppSelector((state) =>
    state.auth.user?.role === "TENANT" ? state.auth.tenantContext?.estate.id : state.auth.selectedEstateId,
  );
  const { data: houses } = useGetHousesByEstateQuery(estateId ?? "", { skip: !estateId || role !== "CARETAKER" });
  const [createComplaint, { isLoading }] = useCreateComplaintMutation();
  const [description, setDescription] = useState("");
  const [houseId, setHouseId] = useState("");

  const onSubmit = async () => {
    await createComplaint({
      description,
      houseId: role === "CARETAKER" ? houseId : undefined,
    }).unwrap();
    navigate("/complaints");
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Submit Complaint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {role === "CARETAKER" ? (
          <div className="space-y-2">
            <Label>House Name</Label>
            <Select value={houseId} onValueChange={setHouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select house" />
              </SelectTrigger>
              <SelectContent>
                {houses?.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>

        <Button disabled={isLoading || !description || (role === "CARETAKER" && !houseId)} onClick={onSubmit}>
          {isLoading ? "Submitting..." : "Submit Complaint"}
        </Button>
      </CardContent>
    </Card>
  );
}
