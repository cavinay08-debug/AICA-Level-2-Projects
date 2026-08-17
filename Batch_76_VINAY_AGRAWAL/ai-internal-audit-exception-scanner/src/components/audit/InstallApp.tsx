import { useEffect, useState } from "react";
import { Download, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type PromptEvent = Event & { prompt: () => Promise<void> };

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showButton = !installed && promptEvent !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showButton && (
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await promptEvent?.prompt();
            setPromptEvent(null);
          }}
        >
          <Download className="size-4" />
          Install App
        </Button>
      )}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="ghost" className="text-xs">
            <HelpCircle className="size-4" />
            Install help
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="absolute right-4 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-4 text-xs leading-relaxed shadow-lg">
          <p className="font-semibold text-card-foreground">Android / Chrome</p>
          <p className="text-muted-foreground">Use “Install App” or “Add to Home Screen”.</p>
          <p className="mt-2 font-semibold text-card-foreground">iPhone / iPad</p>
          <p className="text-muted-foreground">Use Share → Add to Home Screen.</p>
          <p className="mt-2 font-semibold text-card-foreground">Windows / Chrome</p>
          <p className="text-muted-foreground">
            Use the browser install icon or this app’s Install App button.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
