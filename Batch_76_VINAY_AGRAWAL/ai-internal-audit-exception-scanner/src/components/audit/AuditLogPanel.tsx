import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, type AuditLogEntry } from "@/lib/audit/types";

export function AuditLogPanel({
  entries,
  onClear,
}: {
  entries: AuditLogEntry[];
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Stored locally in this browser only — {entries.length} entr
          {entries.length === 1 ? "y" : "ies"}.
        </p>
        <Button size="sm" variant="outline" onClick={onClear} disabled={entries.length === 0}>
          Clear local log
        </Button>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No log entries yet.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-md border border-border bg-muted/40 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-foreground">{entry.action}</span>
              <span className="text-muted-foreground">
                {format(new Date(entry.timestamp), "dd MMM yyyy HH:mm:ss")}
              </span>
            </div>
            <p className="mt-1 font-mono text-muted-foreground">{entry.reference}</p>
            {(entry.previousStatus || entry.newStatus) && (
              <p className="mt-1 text-muted-foreground">
                {entry.previousStatus ? STATUS_LABELS[entry.previousStatus] : "—"} →{" "}
                {entry.newStatus ? STATUS_LABELS[entry.newStatus] : "—"}
              </p>
            )}
            {entry.note && <p className="mt-1 text-foreground">Note: {entry.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
