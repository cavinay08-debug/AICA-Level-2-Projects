import type { AppSettings, AuditException, Transaction } from "./types";
import { RULE_LABELS } from "./types";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(n);

/**
 * Rule-based exception detection. These are risk indicators requiring auditor
 * review — never a conclusion of fraud.
 */
export function detectExceptions(
  transactions: Transaction[],
  settings: AppSettings,
): AuditException[] {
  const exceptions: AuditException[] = [];
  const push = (
    t: Transaction,
    rule: AuditException["rule"],
    detail: string,
    severity: AuditException["severity"],
  ) =>
    exceptions.push({
      id: `${t.id}:${rule}`,
      transactionId: t.id,
      rule,
      label: RULE_LABELS[rule],
      detail,
      severity,
    });

  // Duplicate: same vendor + amount + date
  const dupKey = (t: Transaction) => `${t.vendor.trim().toLowerCase()}|${t.amount}|${t.date}`;
  const dupGroups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const k = dupKey(t);
    dupGroups.set(k, [...(dupGroups.get(k) ?? []), t]);
  }

  // Repeated vendor counts
  const vendorCounts = new Map<string, number>();
  for (const t of transactions) {
    const v = t.vendor.trim().toLowerCase();
    vendorCounts.set(v, (vendorCounts.get(v) ?? 0) + 1);
  }

  for (const t of transactions) {
    const group = dupGroups.get(dupKey(t)) ?? [];
    if (group.length > 1) {
      push(
        t,
        "duplicate",
        `${group.length} entries share vendor, amount ${inr(t.amount)} and date ${t.date}.`,
        "high",
      );
    }

    if (!t.approvedBy || !t.approvedBy.trim()) {
      push(t, "missing_approval", "No approver recorded against this entry.", "high");
    }

    if (
      settings.roundNumberMultiple > 0 &&
      t.amount > 0 &&
      t.amount % settings.roundNumberMultiple === 0
    ) {
      push(
        t,
        "round_number",
        `Amount is an exact multiple of ${inr(settings.roundNumberMultiple)}.`,
        "low",
      );
    }

    if (t.amount >= settings.highValueThreshold) {
      push(
        t,
        "high_value",
        `Amount ${inr(t.amount)} is at or above the high-value threshold ${inr(settings.highValueThreshold)}.`,
        "medium",
      );
    }

    const day = new Date(`${t.date}T00:00:00`).getDay();
    if (day === 0 || day === 6) {
      push(t, "weekend", `Booked on a ${day === 0 ? "Sunday" : "Saturday"}.`, "medium");
    }

    const count = vendorCounts.get(t.vendor.trim().toLowerCase()) ?? 0;
    if (count >= settings.repeatedVendorCount) {
      push(t, "repeated_vendor", `${count} entries booked to this vendor in the period.`, "low");
    }
  }

  return exceptions;
}

export function formatAmount(n: number) {
  return inr(n);
}
