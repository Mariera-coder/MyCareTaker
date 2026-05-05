import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { useGetComplaintsByEstateQuery, useOwnerReviewMutation } from "@/features/complaints/complaintsApi";
import { ComplaintPanel } from "@/features/complaints/ComplaintPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No deductible complaints are waiting for owner approval.
        </div>
      ) : (
        queue.map((complaint) => (
          <ComplaintPanel
            key={complaint.id}
            complaint={complaint}
            actions={
              <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto_auto]">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Approved cost"
                  value={costMap[complaint.id] ?? ""}
                  onChange={(event) =>
                    setCostMap((current) => ({ ...current, [complaint.id]: event.target.value }))
                  }
                />
                <Textarea
                  placeholder="Owner notes"
                  value={noteMap[complaint.id] ?? ""}
                  onChange={(event) =>
                    setNoteMap((current) => ({ ...current, [complaint.id]: event.target.value }))
                  }
                  className="min-h-24"
                />
                <Button
                  disabled={isLoading}
                  className="h-fit"
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
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  disabled={isLoading}
                  className="h-fit"
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
                  Return
                </Button>
              </div>
            }
          />
        ))
      )}
    </div>
  );
}
