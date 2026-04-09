import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { useCaretakerReviewMutation, useGetComplaintsByEstateQuery } from "@/features/complaints/complaintsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CaretakerReviewPage() {
  const estateId = useAppSelector((state) => state.auth.selectedEstateId);
  const { data: complaints } = useGetComplaintsByEstateQuery(estateId ?? "", { skip: !estateId });
  const [review, { isLoading }] = useCaretakerReviewMutation();
  const [costMap, setCostMap] = useState<Record<string, string>>({});
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const queue = (complaints ?? []).filter((complaint) =>
    ["OPEN", "CARETAKER_REVIEW"].includes(complaint.status),
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Caretaker Review Queue</h2>
      {queue.map((complaint) => (
        <Card key={complaint.id}>
          <CardHeader>
            <CardTitle>{complaint.house.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{complaint.description}</p>
            <Input
              type="number"
              step="0.01"
              placeholder="Estimated cost"
              value={costMap[complaint.id] ?? ""}
              onChange={(event) =>
                setCostMap((current) => ({ ...current, [complaint.id]: event.target.value }))
              }
            />
            <Input
              placeholder="Caretaker notes"
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
                      isDeductibleExpense: true,
                      estimatedCost: Number(costMap[complaint.id] || 0),
                      caretakerNotes: noteMap[complaint.id],
                    },
                  })
                }
              >
                Mark as deductible expense
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
