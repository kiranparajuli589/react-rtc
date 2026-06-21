# Capture Studio

Browser-based media recorder built with Next.js. Capture camera, microphone, screen, or screen + camera, preview locally, download, or keep recordings in the current session.

> **Note:** Capture Studio uses browser media capture APIs (`getUserMedia`, `getDisplayMedia`, `MediaRecorder`). It does not use WebRTC peer connections (ICE, SFU, signaling).

## Features

- Camera, audio, screen, and screen + webcam recording modes
- Countdown, mirror, and camera quality settings (720p / 1080p)
- Local preview, download, and session persistence (no upload)
- IndexedDB chunk spillover for long recordings
- Accessible UI built with shadcn / Radix primitives
- Seven locales (en, de, es, fr, hi, ne, zh)

## Browser support

| Browser | Minimum version | Notes |
|---------|-----------------|-------|
| Chrome / Edge | 90+ | Recommended |
| Firefox | 90+ | WebM preferred |
| Safari | 15.4+ | MP4 fallback when supported |

Screen capture requires a desktop browser. Mobile supports camera and audio only.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_RECORD_TIME_LIMIT_IN_SEC` | `7200` | Max recording length (seconds) |
| `NEXT_PUBLIC_DEBUG` | `false` | Verbose client logging |
| `NEXT_PUBLIC_BASE_URL` | `""` | Base URL for notification icons |

## Development

```bash
pnpm install
pnpm dev
```

### Scripts

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

## Manual QA checklist

- [ ] Open menu at `/en` — title shows **Capture Studio**
- [ ] Record camera mode: countdown, record, pause, resume, stop, download
- [ ] Record audio mode with device picker
- [ ] Record screen mode (desktop): stop share via browser UI → recording stops gracefully
- [ ] Record screen + camera: move webcam position, verify composite preview
- [ ] Restart from preview discards in-place (does not return to menu)
- [ ] Switch language and theme from toolbar
- [ ] Keep recording in session, navigate away and back
- [ ] Verify error boundary reload button (optional: force error in dev)

## Permissions troubleshooting

1. Click **Allow** when the browser prompts for camera/microphone.
2. If devices show random IDs, grant permission and reload—the browser hides names until access is granted.
3. For screen recording, pick a tab/window in the system share dialog and return to this tab to start.
4. If stuck, use browser site settings to reset permissions and reload.

## Known limitations

- Recordings stay on your device until you download or clear them (no cloud upload).
- Screen resolution follows the picker, not the quality setting.
- Desktop notifications require browser permission and may use the service worker when available.

## Architecture

See [docs/architecture.md](docs/architecture.md) and [docs/adr/001-media-pipeline.md](docs/adr/001-media-pipeline.md).
