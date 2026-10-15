# Josefa

**Tell your document what to do.**

A desktop-first, responsive document editor with a complete mobile editor, typed and browser speech commands. Operated by StartRight NG Business Ventures, founded by Adaeze Emilia Mbakwe.

## Architecture

TypeScript, Vite, Tiptap/ProseMirror, IndexedDB (`idb`), JSZip and `docx`. All document work takes place in the browser. No login, document backend, paid AI, analytics or text-to-speech. Cloudflare Workers Static Assets hosts the built application.

## Development

Use Node 22 or later. `npm ci`, `npm run dev`, `npm test`, `npm run build`.

`npm run test:e2e` runs Playwright desktop/mobile workflows. The test config supports JOSEFA_CHROMIUM_PATH for an existing Chromium executable (in this build environment `/tmp/josefa-chromium`); otherwise install Playwright Chromium and update the launch path for your system. `JOSEFA_TEST_URL=https://josefa.startright.ng npm run test:e2e` runs the same workflows on the live site. `npm test` generates the two synthetic Word fixtures used by these tests. All sample content is synthetic.

Deploy the production `dist` folder with the supplied Wrangler configuration, e.g. `npx wrangler deploy` in an authenticated environment. This release is published through the connected Cloudflare API using its static-asset manifest, upload session and script-upload APIs. The asset upload helper reads a short-lived session file and does not contain account credentials. Session/completion files are ignored. No secrets belong in source control.

## Working features

- Structured rich-text editor, headings, font family/size, colours, highlighting, alignment, lists, paragraph indentation/spacing, hyperlinks, basic tables and explicit page breaks.
- Manual editing and keyboard shortcuts; typed and speech commands use the same deterministic command engine. Command mode and Dictation mode are separate.
- Exact search, keyword-based approximate passage suggestions, multiple results, paragraph/heading navigation, selection context, limited compound commands, replacement, confirmed deletion/movement, internal clipboard, undo/redo and confirmed formatting presets.
- Local autosave, reopen, rename, duplicate, delete confirmation, original-file retention and independent Word export. Native file sharing where supported, download fallback otherwise.
- Light/dark/system themes, speech language settings, responsive layouts, install manifest, service worker and offline manual editing after caching.

## Compatibility and limits

- Browser speech recognition can send audio to the browser provider and need internet. No universal/offline/accent accuracy guarantee. English Nigeria/UK/US are selectable. Real audio and installed-phone tests require actual hardware and were not performed in this build environment.
- Commands are a documented grammar with variations, not unlimited natural-language understanding. Approximate search is keyword matching, not semantic AI. See the in-app guide for supported instructions.
- Continuous editor; explicit page-break markers, no reliable page-number navigation or Word pagination.
- Word imports support text, basic headings/styles, bold/italic/underline/strike, supported fonts/sizes/colours, basic lists, tables, alignment, links and paragraph spacing. Advanced styles/numbering, nested list levels, merged vertical cells, Word layout, images, headers/footers, sections, fields, comments, tracked changes, footnotes and text boxes are not faithfully editable. Compatibility is disclosed before import and the original is retained separately; export creates a fresh .docx and never overwrites it. Tracked insertions appear as ordinary text; deletions are omitted from the editable copy.
- Import limit: 25 MB compressed, 60 MB expanded and 20 million XML characters. Local storage is not encrypted by this app and is not a backup. Clear-browser/uninstall/device changes may remove documents.
- No jurisdiction-specific legal or institutional academic compliance is promised by presets.

## Verification

Live application: https://josefa.startright.ng · [Verification details](docs/VERIFICATION.md)


Unit/integration tests check actual ProseMirror state changes and independent Word parsing using Mammoth. Playwright tests cover create/edit/save/reload/reopen/export, Word import including tables/lists/alignment, contextual actions, undo/redo, a 1,500-paragraph document, unavailable microphone, separate dictation, responsive sizes (320 through 1440 px), dark mode, and document management.
