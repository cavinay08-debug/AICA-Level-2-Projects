# AI Internal Audit Exception Scanner

Rule-based internal audit exception scanner with AI-assisted observations, installable as a PWA and packageable as a Windows desktop app.

Flagged items are **exceptions / risk indicators requiring auditor review** — never conclusions of fraud. Auditor review remains mandatory.

## Web application

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # production build (output: dist/)
```

## Testing the PWA

Service workers only register in a production build on a real (non-preview, non-iframe) host:

```bash
npm run build && npm run preview
```

Then check DevTools → Application → Manifest / Service Workers. Add `?sw=off` to any URL to unregister the worker.

Offline behaviour: the app shell, static assets and the demo ledger load without a connection. AI observations do not — the app shows "AI audit observations require an internet connection."

## Installing the PWA

- **Android / Chrome** — use the in-app "Install App" button or browser menu → Add to Home Screen.
- **iPhone / iPad** — Share → Add to Home Screen.
- **Windows / Chrome or Edge** — use the install icon in the address bar or the in-app "Install App" button.

## Electron (Windows desktop)

```bash
npm install --save-dev electron electron-builder
npm run dev            # terminal 1
npm run electron:dev   # terminal 2 (loads http://localhost:8080)
```

Packaged builds:

```bash
npm run electron:build     # portable EXE + NSIS installer
npm run windows:installer  # NSIS installer only
```

Generated files land in `dist-electron/` (`*.exe` portable and installer).

Electron uses the same dashboard and business logic. `contextIsolation: true` / `nodeIntegration: false`; the renderer only sees an allow-listed `auditDesktop` bridge for CSV selection and report export. No API keys are exposed to the renderer.

Set `AUDIT_APP_URL` to point the desktop shell at a hosted deployment of the app instead of a local build.

## GitHub Actions Windows build

`.github/workflows/build-windows.yml` runs on `windows-latest`, installs dependencies, builds the web app, then runs `electron-builder --win portable nsis` and uploads `dist-electron/*.exe` as workflow artifacts. Trigger it manually (workflow_dispatch) or by pushing a `v*` tag. Windows EXEs cannot be built inside the Lovable sandbox.

## Data & storage

Demo transactions, exception review status, auditor notes, settings and the local audit log are stored in browser local storage. There is no database and no server sync — the status indicator shows "Sync not available".

## Features requiring internet

- AI-generated audit observations only.

## Secure AI configuration

The AI key (`LOVABLE_API_KEY`, or your own Gemini key if you swap providers) is read **only** inside the server function in `src/lib/audit-ai.functions.ts` via `process.env`. Never place an AI key in React/renderer code or in a committed file. CSV files are never uploaded; only a summary of flagged exceptions is sent, and only after the auditor confirms the on-screen warning.
