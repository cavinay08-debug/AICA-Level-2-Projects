import type { AuditException, Transaction } from "./types";
import { STATUS_LABELS, type ExceptionReview } from "./types";

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

const pick = (row: Record<string, string>, keys: string[]) => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k];
  return "";
};

function normalizeDate(raw: string): string {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
}

/** Parses a ledger CSV into transactions. Headers are matched case-insensitively. */
export function parseTransactionsCsv(text: string): { transactions: Transaction[]; skipped: number } {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return { transactions: [], skipped: 0 };
  const headers = splitLine(lines[0]!).map((h) => h.toLowerCase());
  const transactions: Transaction[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ""));

    const amount = Number(
      pick(row, ["amount", "value", "debit", "amount (inr)"]).replace(/[^0-9.-]/g, ""),
    );
    const date = normalizeDate(pick(row, ["date", "txn date", "transaction date", "voucher date"]));
    if (!date || Number.isNaN(amount)) {
      skipped++;
      continue;
    }
    transactions.push({
      id: pick(row, ["id", "txn id", "voucher no", "voucher", "reference"]) || `CSV-${i}`,
      date,
      vendor: pick(row, ["vendor", "party", "payee", "supplier", "name"]) || "Unknown",
      description: pick(row, ["description", "narration", "particulars", "remarks"]),
      amount,
      approvedBy: pick(row, ["approvedby", "approved by", "approver", "authorised by"]),
      account: pick(row, ["account", "ledger", "gl", "head"]) || "Unclassified",
    });
  }
  return { transactions, skipped };
}

const csvCell = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function buildReportCsv(
  transactions: Transaction[],
  exceptions: AuditException[],
  reviews: Record<string, ExceptionReview>,
  aiObservations: string,
): string {
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const head = [
    "Exception Ref",
    "Transaction Ref",
    "Date",
    "Vendor",
    "Account",
    "Amount",
    "Approved By",
    "Risk Indicator",
    "Detail",
    "Severity",
    "Review Status",
    "Auditor Note",
  ];
  const rows = exceptions.map((e) => {
    const t = byId.get(e.transactionId);
    const r = reviews[e.id];
    return [
      e.id,
      e.transactionId,
      t?.date ?? "",
      t?.vendor ?? "",
      t?.account ?? "",
      t?.amount ?? "",
      t?.approvedBy ?? "",
      e.label,
      e.detail,
      e.severity,
      STATUS_LABELS[r?.status ?? "pending"],
      r?.note ?? "",
    ]
      .map(csvCell)
      .join(",");
  });

  const preamble = [
    `"AI Internal Audit Exception Scanner — Exception Report"`,
    `"Generated","${new Date().toISOString()}"`,
    `"Transactions scanned","${transactions.length}"`,
    `"Exceptions raised","${exceptions.length}"`,
    `"Note","Items listed are exceptions / risk indicators requiring auditor review. They are not conclusions of fraud."`,
    "",
  ];

  const ai = aiObservations
    ? ["", `"AI audit observations (require auditor review)"`, csvCell(aiObservations)]
    : [];

  return [...preamble, head.map(csvCell).join(","), ...rows, ...ai].join("\n");
}
