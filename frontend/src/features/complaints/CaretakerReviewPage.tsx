import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { useCaretakerReviewMutation, useGetComplaintsByEstateQuery } from "@/features/complaints/complaintsApi";
import { ComplaintPanel } from "@/features/complaints/ComplaintPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No complaints are waiting for caretaker review right now.
        </div>
      ) : (
        queue.map((complaint) => (
          <ComplaintPanel
            key={complaint.id}
            complaint={complaint}
            actions={
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Estimated cost"
                  value={costMap[complaint.id] ?? ""}
                  onChange={(event) =>
                    setCostMap((current) => ({ ...current, [complaint.id]: event.target.value }))
                  }
                />
                <Textarea
                  placeholder="Caretaker notes"
                  value={noteMap[complaint.id] ?? ""}
                  onChange={(event) =>
                    setNoteMap((current) => ({ ...current, [complaint.id]: event.target.value }))
                  }
                  className="min-h-24"
                />
                <Button
                  disabled={isLoading}
                  className="h-fit w-full lg:w-auto"
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
                  Send to Owner
                </Button>
              </div>
            }
          />
        ))
      )}
    </div>
  );
}
