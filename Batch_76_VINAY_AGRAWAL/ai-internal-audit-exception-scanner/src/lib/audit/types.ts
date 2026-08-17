export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  vendor: string;
  description: string;
  amount: number;
  approvedBy: string;
  account: string;
};

export type RuleId =
  | "duplicate"
  | "missing_approval"
  | "round_number"
  | "high_value"
  | "weekend"
  | "repeated_vendor";

export type Severity = "low" | "medium" | "high";

export type AuditException = {
  id: string;
  transactionId: string;
  rule: RuleId;
  label: string;
  detail: string;
  severity: Severity;
};

export type ReviewStatus = "pending" | "under_review" | "accepted" | "cleared";

export type ExceptionReview = {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  reference: string;
  action: string;
  previousStatus?: ReviewStatus | undefined;
  newStatus?: ReviewStatus | undefined;
  note?: string | undefined;
};

export type AppSettings = {
  highValueThreshold: number;
  roundNumberMultiple: number;
  repeatedVendorCount: number;
  aiConsentAcknowledged: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  highValueThreshold: 100000,
  roundNumberMultiple: 10000,
  repeatedVendorCount: 3,
  aiConsentAcknowledged: false,
};

export const RULE_LABELS: Record<RuleId, string> = {
  duplicate: "Duplicate transaction",
  missing_approval: "Missing approval",
  round_number: "Round-number transaction",
  high_value: "High-value transaction",
  weekend: "Weekend transaction",
  repeated_vendor: "Repeated vendor",
};

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending review",
  under_review: "Under review",
  accepted: "Exception confirmed",
  cleared: "Cleared / explained",
};
