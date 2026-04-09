import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useAssignCaretakerMutation, useGetEstateByIdQuery } from "@/features/estates/estatesApi";
import { useGetUsersQuery } from "@/features/users/usersApi";
import { useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function EstateDetailPage() {
  const { estateId = "" } = useParams();
  const { data, isLoading } = useGetEstateByIdQuery(estateId, { skip: !estateId });
  const { data: caretakers } = useGetUsersQuery("CARETAKER");
  const [assignCaretaker, { isLoading: assigning }] = useAssignCaretakerMutation();
  const role = useAppSelector((state) => state.auth.user?.role);
  const [caretakerId, setCaretakerId] = useState("");

  const handleAssignCaretaker = async () => {
    if (!estateId || !caretakerId) return;
    await assignCaretaker({ estateId, user_id: caretakerId }).unwrap();
    setCaretakerId("");
  };

  if (isLoading) return <p>Loading estate...</p>;
  if (!data) return <p>Estate not found.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>
          <span className="font-medium">Address:</span> {data.address}
        </p>
        <p>
          <span className="font-medium">City:</span> {data.city}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/units?estateId=${data.id}`}>View Units</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/complaints?estateId=${data.id}`}>View Complaints</Link>
          </Button>
        </div>
        {role === "ADMIN" ? (
          <div className="space-y-2 rounded-md border p-4">
            <Label>Assign Caretaker</Label>
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={caretakerId} onValueChange={setCaretakerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select caretaker" />
                </SelectTrigger>
                <SelectContent>
                  {caretakers?.map((caretaker) => (
                    <SelectItem key={caretaker.id} value={caretaker.id}>
                      {caretaker.first_name} {caretaker.last_name} ({caretaker.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignCaretaker} disabled={assigning || !caretakerId}>
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
