import { useState } from "react";
import { Sparkles, TriangleAlert, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AiObservations({
  online,
  observations,
  loading,
  error,
  consentGiven,
  onConsent,
  onGenerate,
  disabled,
}: {
  online: boolean;
  observations: string;
  loading: boolean;
  error: string | null;
  consentGiven: boolean;
  onConsent: () => void;
  onGenerate: () => void;
  disabled: boolean;
}) {
  const [showConsent, setShowConsent] = useState(false);

  return (
    <div className="space-y-3">
      {!online && (
        <Alert variant="destructive">
          <WifiOff className="size-4" />
          <AlertTitle>Offline</AlertTitle>
          <AlertDescription>AI audit observations require an internet connection.</AlertDescription>
        </Alert>
      )}

      {showConsent && !consentGiven && (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>Before sending audit data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              A summary of the flagged exceptions (vendor, date, amount, rule) will be sent to an
              external AI service for drafting observations. Nothing is uploaded automatically and
              your CSV file itself is never uploaded. Confirm only if client consent permits it.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onConsent();
                  setShowConsent(false);
                  onGenerate();
                }}
              >
                I understand, continue
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowConsent(false)}>
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={disabled || loading}
          onClick={() => {
            if (!online) return;
            if (!consentGiven) {
              setShowConsent(true);
              return;
            }
            onGenerate();
          }}
        >
          <Sparkles className="size-4" />
          {loading ? "Drafting observations…" : "Generate AI observations"}
        </Button>
        {!online && (
          <span className="text-xs text-muted-foreground">
            AI audit observations require an internet connection.
          </span>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {observations ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            AI-generated draft — auditor review is mandatory
          </p>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
            {observations}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Observations are drafted from the exception summary only. Items are exceptions and risk
          indicators requiring review — not findings of fraud.
        </p>
      )}
    </div>
  );
}
