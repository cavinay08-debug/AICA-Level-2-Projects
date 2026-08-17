import { useEffect, useState } from "react";
import { Wifi, WifiOff, CloudOff } from "lucide-react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export function ConnectionStatus({ online }: { online: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
          online
            ? "border-success/30 bg-success/10 text-success"
            : "border-warning/30 bg-warning/10 text-warning"
        }`}
      >
        {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        {online ? "Online" : "Offline"}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-medium text-muted-foreground">
        <CloudOff className="size-3.5" />
        Sync not available
      </span>
    </div>
  );
}
