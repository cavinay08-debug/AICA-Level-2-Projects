import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/lib/audit/rules";
import type { AuditException, Transaction } from "@/lib/audit/types";

export function TransactionTable({
  transactions,
  exceptions,
}: {
  transactions: Transaction[];
  exceptions: AuditException[];
}) {
  const flags = new Map<string, AuditException[]>();
  for (const e of exceptions) {
    flags.set(e.transactionId, [...(flags.get(e.transactionId) ?? []), e]);
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[52rem]">
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Ref</TableHead>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Vendor</TableHead>
            <TableHead className="whitespace-nowrap">Particulars</TableHead>
            <TableHead className="whitespace-nowrap">Account</TableHead>
            <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
            <TableHead className="whitespace-nowrap">Approved by</TableHead>
            <TableHead className="whitespace-nowrap">Risk indicators</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => {
            const rowFlags = flags.get(t.id) ?? [];
            return (
              <TableRow key={t.id} className={rowFlags.length ? "bg-warning/5" : undefined}>
                <TableCell className="font-mono text-xs whitespace-nowrap">{t.id}</TableCell>
                <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                <TableCell className="whitespace-nowrap font-medium">{t.vendor}</TableCell>
                <TableCell className="max-w-[16rem] truncate">{t.description}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {t.account}
                </TableCell>
                <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                  {formatAmount(t.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {t.approvedBy || <span className="text-warning">Not recorded</span>}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {rowFlags.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      rowFlags.map((f) => (
                        <Badge key={f.id} variant="outline" className="text-[0.7rem]">
                          {f.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No transactions loaded. Upload a CSV or load the demo ledger.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
