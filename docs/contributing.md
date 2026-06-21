# Contributing

## Adding a recording mode

1. Add a `RECORDING_TYPE` constant in `app/constants/recordingTypes.ts`.
2. Add menu option in `app/constants/recording.ts` with `messageKey` for i18n.
3. Create a mode hook under `app/hooks/recorder/` wrapping `useMediaRecorder` + `useStream`.
4. Add a recorder component under `app/components/features/recorderMenu/`.
5. Register in `RecorderModePanel` (`app/components/features/recorderMenu/recorderModePanel/`) with `dynamic()` import.
6. Add strings to **all seven** locale files in `messages/`.
7. Document behavior in an ADR if the pipeline changes.

For **screen + camera**, reuse `DraggableWebcamPip`, `screenWebcamCompositor`, and `WebcamOverlayPlacement`—keep preview and compositor placement in sync.

## i18n rules

- Brand name: **Capture Studio** (keep untranslated in titles).
- No hardcoded user-facing English in components or hooks—use `useTranslations`.
- Namespaces: `common`, `menu`, `toolbar`, `confirm`, `notifications`, `errors`, `countdown`, `devices`, `webcamOverlay`, `createAnnouncement`, etc.
- Notification copy lives in `notifications` namespace; hooks pass translated strings to `notifyMe`.

## Hook conventions

- Mode hooks own stream merge logic and canvas draw loops.
- `useMediaRecorder` owns recorder state—do not duplicate generation tokens.
- Use `useCallback` for stream init functions referenced in `useEffect` deps (see flicker test).
- Clean up tracks in `useEffect` return on unmount.

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Run the manual QA checklist in [README.md](../README.md) for recording flows.
