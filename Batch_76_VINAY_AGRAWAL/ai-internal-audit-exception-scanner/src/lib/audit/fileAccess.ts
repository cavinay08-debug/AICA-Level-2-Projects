/**
 * Small file-access abstraction so the same UI works in the browser (PWA) and
 * inside Electron. CSV parsing itself is untouched — this only gets/puts text.
 */

type DesktopBridge = {
  isElectron?: boolean;
  openCsv?: () => Promise<{ canceled: boolean; name?: string; content?: string }>;
  saveReport?: (
    name: string,
    content: string,
  ) => Promise<{ canceled: boolean; path?: string }>;
};

function bridge(): DesktopBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { auditDesktop?: DesktopBridge }).auditDesktop;
}

export const isDesktop = () => Boolean(bridge()?.isElectron);

/** Returns CSV text chosen by the user, or null when cancelled. */
export async function pickCsvText(): Promise<{ name: string; content: string } | null> {
  const desktop = bridge();
  if (desktop?.openCsv) {
    const res = await desktop.openCsv();
    if (res.canceled || !res.content) return null;
    return { name: res.name ?? "selected.csv", content: res.content };
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve({ name: file.name, content: await file.text() });
    };
    input.click();
  });
}

export async function saveTextFile(fileName: string, content: string): Promise<void> {
  const desktop = bridge();
  if (desktop?.saveReport) {
    await desktop.saveReport(fileName, content);
    return;
  }
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
