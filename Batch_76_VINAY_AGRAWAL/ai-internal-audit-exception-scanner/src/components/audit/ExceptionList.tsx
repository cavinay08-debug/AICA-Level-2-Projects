import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/audit/rules";
import {
  STATUS_LABELS,
  type AuditException,
  type ExceptionReview,
  type ReviewStatus,
  type Transaction,
} from "@/lib/audit/types";

const STATUS_ORDER: ReviewStatus[] = ["pending", "under_review", "accepted", "cleared"];

const severityVariant: Record<AuditException["severity"], "destructive" | "secondary" | "outline"> =
  {
    high: "destructive",
    medium: "secondary",
    low: "outline",
  };

export function ExceptionList({
  exceptions,
  transactions,
  reviews,
  onStatusChange,
  onNoteChange,
}: {
  exceptions: AuditException[];
  transactions: Transaction[];
  reviews: Record<string, ExceptionReview>;
  onStatusChange: (exception: AuditException, status: ReviewStatus) => void;
  onNoteChange: (exception: AuditException, note: string) => void;
}) {
  const byId = new Map(transactions.map((t) => [t.id, t]));

  if (exceptions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No exceptions raised for the loaded ledger.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {exceptions.map((e) => {
        const t = byId.get(e.transactionId);
        const review = reviews[e.id];
        const status = review?.status ?? "pending";
        return (
          <Card key={e.id} className="border-border">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[e.severity]}>{e.label}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {e.transactionId}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">{e.detail}</p>
                  {t && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.date} · {t.vendor} · {formatAmount(t.amount)} · {t.account}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {STATUS_LABELS[status]}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === status ? "default" : "outline"}
                    onClick={() => onStatusChange(e, s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>

              <Textarea
                placeholder="Auditor note (mandatory review evidence)…"
                value={review?.note ?? ""}
                onChange={(event) => onNoteChange(e, event.target.value)}
                className="min-h-16 text-sm"
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
