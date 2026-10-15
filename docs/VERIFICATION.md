# Josefa verification — 15 October 2026

Public application: https://josefa.startright.ng

Cloudflare fallback: https://josefa.adaezembakwe.workers.dev

Repository: https://github.com/emiliambakwe2016-ux/josefa

## Verified

- Production TypeScript check and Vite build pass.
- 26 unit/integration tests pass. Actual ProseMirror changes include exact/normalised search, keyword suggestions, targeting, context, formatting, combined instructions, ambiguous-target safeguards, confirmed replacements/deletions/moves, clipboard, presets and undo/redo.
- Word files are genuine OOXML ZIPs; export is independently parsed with Mammoth. Round trips verify supported headings, basic inline formatting, lists, tables, links, alignment and line spacing. Synthetic representative and 1,500-paragraph Word files are tested.
- 12 local browser workflows pass across desktop and mobile projects, including 320px, tablet, portrait, landscape and desktop sizes. Actual content changes, persistence, reload/reopen, download, import, long-document search, dark theme and document management are asserted.
- 14 production browser workflows pass on the HTTPS custom domain: the same 12 workflows plus two production PWA/offline workflows. Offline reload, persisted content, command formatting and Word download work after assets are cached, on desktop and mobile emulation.
- The live application was additionally opened in the connected cloud browser. Compound typed navigation/formatting changed the content and local Save reported success.

## Remaining verification boundaries

Real microphone audio, Nigerian-accent recognition, physical smartphone keyboards/touch selection, native share sheets and actual OS-level PWA installation/standalone launch were not tested. Browser emulation is not real hardware testing. Speech integration uses browser recognition and may need the provider’s external service/internet; manual editing and typed commands remain usable when recognition is unavailable.

## Product compatibility boundaries

Commands are a defined grammar, not unrestricted AI. Approximate results are keyword suggestions, not semantic understanding. Layout presets are deterministic and do not certify legal/academic compliance. Page-number navigation is intentionally absent in the continuous editor.

Word advanced styles/page layout, nested numbering and vertical merged cells may change; headers/footers, images, comments, tracked changes, footnotes, text boxes and fields are not faithfully editable. Import warns before conversion and retains the original separately on the device. Export creates a fresh Word file; original files are downloadable in My Documents.

Local IndexedDB storage is not a permanent backup and is not app-encrypted. Clearing storage, uninstalling or changing devices may remove local files. Export important work.

No compulsory registration, paid AI service, server document storage, document-content analytics or read-aloud feature is present.
