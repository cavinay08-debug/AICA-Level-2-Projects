import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AiObservations } from "@/components/audit/AiObservations";
import { AuditLogPanel } from "@/components/audit/AuditLogPanel";
import { ConnectionStatus, useOnlineStatus } from "@/components/audit/ConnectionStatus";
import { ExceptionList } from "@/components/audit/ExceptionList";
import { InstallApp } from "@/components/audit/InstallApp";
import { TransactionTable } from "@/components/audit/TransactionTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateAuditObservations } from "@/lib/audit-ai.functions";
import { buildReportCsv, parseTransactionsCsv } from "@/lib/audit/csv";
import { DEMO_TRANSACTIONS } from "@/lib/audit/demo";
import { pickCsvText, saveTextFile } from "@/lib/audit/fileAccess";
import { detectExceptions, formatAmount } from "@/lib/audit/rules";
import {
  appendAuditLog,
  clearAuditLog,
  loadAuditLog,
  loadObservations,
  loadReviews,
  loadSettings,
  loadTransactions,
  saveObservations,
  saveReviews,
  saveSettings,
  saveTransactions,
} from "@/lib/audit/storage";
import {
  RULE_LABELS,
  type AppSettings,
  type AuditException,
  type AuditLogEntry,
  type ExceptionReview,
  type ReviewStatus,
  type RuleId,
  type Transaction,
} from "@/lib/audit/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Internal Audit Exception Scanner" },
      {
        name: "description",
        content:
          "Scan ledger transactions for audit exceptions — duplicates, missing approvals, round numbers, high-value, weekend and repeated-vendor risk indicators.",
      },
      { property: "og:title", content: "AI Internal Audit Exception Scanner" },
      {
        property: "og:description",
        content:
          "AI-assisted internal audit exception scanner for CA offices. Works offline, installable, exception review workflow built in.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const online = useOnlineStatus();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<Record<string, ExceptionReview>>({});
  const [settings, setSettings] = useState<AppSettings>(() => ({
    highValueThreshold: 100000,
    roundNumberMultiple: 10000,
    repeatedVendorCount: 3,
    aiConsentAcknowledged: false,
  }));
  const [log, setLog] = useState<AuditLogEntry[]>([]);
  const [observations, setObservations] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState("No ledger loaded");

  const runAi = useServerFn(generateAuditObservations);

  useEffect(() => {
    setTransactions(loadTransactions());
    setReviews(loadReviews());
    setSettings(loadSettings());
    setLog(loadAuditLog());
    setObservations(loadObservations());
  }, []);

  const exceptions = useMemo(
    () => detectExceptions(transactions, settings),
    [transactions, settings],
  );

  const counts = useMemo(() => {
    const map = new Map<RuleId, number>();
    for (const e of exceptions) map.set(e.rule, (map.get(e.rule) ?? 0) + 1);
    return map;
  }, [exceptions]);

  const pendingCount = exceptions.filter(
    (e) => (reviews[e.id]?.status ?? "pending") === "pending",
  ).length;

  const applyTransactions = useCallback((next: Transaction[], label: string, action: string) => {
    setTransactions(next);
    saveTransactions(next);
    setSourceLabel(label);
    setLog(appendAuditLog({ reference: label, action }));
  }, []);

  const handleUpload = async () => {
    try {
      const file = await pickCsvText();
      if (!file) return;
      const { transactions: parsed, skipped } = parseTransactionsCsv(file.content);
      if (parsed.length === 0) {
        toast.error("No usable rows found in that CSV.");
        return;
      }
      applyTransactions(parsed, file.name, "Ledger CSV loaded");
      toast.success(
        `Loaded ${parsed.length} transactions${skipped ? ` (${skipped} rows skipped)` : ""}.`,
      );
    } catch {
      toast.error("Could not read that file.");
    }
  };

  const handleDemo = () => {
    applyTransactions(DEMO_TRANSACTIONS, "Demo ledger", "Demo data loaded");
    toast.success(`Loaded ${DEMO_TRANSACTIONS.length} demo transactions.`);
  };

  const updateReview = (
    exception: AuditException,
    patch: Partial<ExceptionReview>,
    action: string,
  ) => {
    const previous = reviews[exception.id];
    const next: ExceptionReview = {
      status: patch.status ?? previous?.status ?? "pending",
      note: patch.note ?? previous?.note ?? "",
      updatedAt: new Date().toISOString(),
    };
    const merged = { ...reviews, [exception.id]: next };
    setReviews(merged);
    saveReviews(merged);
    setLog(
      appendAuditLog({
        reference: `${exception.id} (${exception.transactionId})`,
        action,
        previousStatus: previous?.status ?? "pending",
        newStatus: next.status,
        note: next.note || undefined,
      }),
    );
  };

  const handleStatus = (exception: AuditException, status: ReviewStatus) =>
    updateReview(exception, { status }, "Exception status changed");

  const handleNote = (exception: AuditException, note: string) => {
    const previous = reviews[exception.id];
    const next: ExceptionReview = {
      status: previous?.status ?? "pending",
      note,
      updatedAt: new Date().toISOString(),
    };
    const merged = { ...reviews, [exception.id]: next };
    setReviews(merged);
    saveReviews(merged);
  };

  const handleNoteCommit = (exception: AuditException) => {
    const note = reviews[exception.id]?.note ?? "";
    if (!note) return;
    setLog(
      appendAuditLog({
        reference: `${exception.id} (${exception.transactionId})`,
        action: "Auditor note saved",
        previousStatus: reviews[exception.id]?.status ?? "pending",
        newStatus: reviews[exception.id]?.status ?? "pending",
        note,
      }),
    );
  };

  const handleExport = async () => {
    if (exceptions.length === 0) {
      toast.error("Nothing to export yet.");
      return;
    }
    const csv = buildReportCsv(transactions, exceptions, reviews, observations);
    const name = `audit-exception-report-${new Date().toISOString().slice(0, 10)}.csv`;
    await saveTextFile(name, csv);
    setLog(appendAuditLog({ reference: name, action: "Exception report exported" }));
    toast.success("Exception report exported.");
  };

  const handleGenerateAi = async () => {
    if (!online) {
      setAiError("AI audit observations require an internet connection.");
      return;
    }
    if (exceptions.length === 0) {
      setAiError("Load a ledger and detect exceptions first.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const byId = new Map(transactions.map((t) => [t.id, t]));
      const summary = [
        `Transactions scanned: ${transactions.length}`,
        `Exceptions raised: ${exceptions.length}`,
        "",
        ...exceptions.slice(0, 60).map((e) => {
          const t = byId.get(e.transactionId);
          return `- ${e.label} | ref ${e.transactionId} | ${t?.date ?? "?"} | ${t?.vendor ?? "?"} | ${
            t ? formatAmount(t.amount) : "?"
          } | ${e.detail}`;
        }),
      ].join("\n");

      const result = await runAi({ data: { summary } });
      setObservations(result.observations);
      saveObservations(result.observations);
      setLog(appendAuditLog({ reference: sourceLabel, action: "AI observations generated" }));
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "Could not generate AI observations right now.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const acknowledgeConsent = () => {
    const next = { ...settings, aiConsentAcknowledged: true };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[100rem] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldAlert className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-card-foreground sm:text-xl">
                AI Internal Audit Exception Scanner
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Rule-based exception detection with mandatory auditor review · {sourceLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ConnectionStatus online={online} />
            <InstallApp />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleUpload}>
            <Upload className="size-4" />
            Upload CSV
          </Button>
          <Button variant="secondary" onClick={handleDemo}>
            <Database className="size-4" />
            Load Demo Data
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            Export report
          </Button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<FileSpreadsheet className="size-4" />}
            label="Transactions scanned"
            value={transactions.length}
          />
          <SummaryCard
            icon={<ShieldAlert className="size-4" />}
            label="Exceptions raised"
            value={exceptions.length}
          />
          <SummaryCard
            icon={<ClipboardCheck className="size-4" />}
            label="Pending review"
            value={pendingCount}
          />
          <SummaryCard
            icon={<ClipboardCheck className="size-4" />}
            label="Log entries"
            value={log.length}
          />
        </section>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk indicators by rule</CardTitle>
            <CardDescription>
              Flagged items are exceptions requiring review — never a conclusion of fraud.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(Object.keys(RULE_LABELS) as RuleId[]).map((rule) => (
              <div
                key={rule}
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <p className="text-xs text-muted-foreground">{RULE_LABELS[rule]}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {counts.get(rule) ?? 0}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="transactions">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions ({exceptions.length})</TabsTrigger>
            <TabsTrigger value="ai">AI observations</TabsTrigger>
            <TabsTrigger value="log">Local audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardContent className="p-0 sm:p-2">
                <TransactionTable transactions={transactions} exceptions={exceptions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exceptions" className="mt-4">
            <div onBlur={() => undefined}>
              <ExceptionList
                exceptions={exceptions}
                transactions={transactions}
                reviews={reviews}
                onStatusChange={handleStatus}
                onNoteChange={(exception, note) => {
                  handleNote(exception, note);
                  if (note.endsWith("\n")) handleNoteCommit(exception);
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI-generated audit observations</CardTitle>
                <CardDescription>
                  Requires an internet connection. Only the exception summary is sent — never your
                  CSV file, and never automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AiObservations
                  online={online}
                  observations={observations}
                  loading={aiLoading}
                  error={aiError}
                  consentGiven={settings.aiConsentAcknowledged}
                  onConsent={acknowledgeConsent}
                  onGenerate={handleGenerateAi}
                  disabled={!online || exceptions.length === 0}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Local audit log</CardTitle>
                <CardDescription>
                  Status changes, auditor notes and review actions kept in this browser. No server
                  sync.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogPanel
                  entries={log}
                  onClear={() => {
                    setLog(clearAuditLog());
                    toast.success("Local audit log cleared.");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <span className="grid size-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
