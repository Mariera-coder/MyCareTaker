import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { useGetComplaintsByEstateQuery, useOwnerReviewMutation } from "@/features/complaints/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OwnerApprovalPage() {
  const estateId = useAppSelector((state) => state.auth.selectedEstateId);
  const { data: complaints } = useGetComplaintsByEstateQuery(estateId ?? "", { skip: !estateId });
  const [review, { isLoading }] = useOwnerReviewMutation();
  const [costMap, setCostMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const queue = (complaints ?? []).filter(
    (complaint) => complaint.isDeductibleExpense && complaint.status === "CARETAKER_REVIEW",
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Approved Complaints</h2>
      {queue.map((complaint) => (
        <Card key={complaint.id}>
          <CardHeader>
            <CardTitle>{complaint.house.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{complaint.description}</p>
            <p className="text-sm text-slate-600">Estimated cost: {complaint.estimatedCost ?? "-"}</p>
            <Input
              type="number"
              step="0.01"
              placeholder="Approved cost"
              value={costMap[complaint.id] ?? ""}
              onChange={(event) =>
                setCostMap((current) => ({ ...current, [complaint.id]: event.target.value }))
              }
            />
            <Input
              placeholder="Owner notes"
              value={noteMap[complaint.id] ?? ""}
              onChange={(event) =>
                setNoteMap((current) => ({ ...current, [complaint.id]: event.target.value }))
              }
            />
            <div className="flex gap-3">
              <Button
                disabled={isLoading}
                onClick={() =>
                  review({
                    id: complaint.id,
                    body: {
                      decision: "APPROVED",
                      approvedCost: Number(costMap[complaint.id] || complaint.estimatedCost || 0),
                      ownerNotes: noteMap[complaint.id],
                    },
                  })
                }
              >
                Approve Cost
              </Button>
              <Button
                variant="destructive"
                disabled={isLoading}
                onClick={() =>
                  review({
                    id: complaint.id,
                    body: {
                      decision: "REJECTED",
                      ownerNotes: noteMap[complaint.id] || "Returned to caretaker",
                    },
                  })
                }
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
