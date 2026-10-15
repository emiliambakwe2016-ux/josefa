# Josefa 1.0.1 — heading navigation and combined-command correction

Targeted correction to the existing application, 15 October 2026. No editor replacement, storage migration, new repository, domain or Cloudflare resource.

## Root causes established in the code

1. Only heading-like style IDs were read during Word import. Style display names, aliases, direct paragraph outline levels and inherited (`basedOn`) heading metadata were missed.
2. “Find the heading Conclusion” used the general text-search path, so ordinary mentions competed with headings.
3. Ambiguous combined instructions returned search results but discarded the remaining formatting operation. Results lacked structural labels and surrounding context; mobile results did not open automatically.

The user's exact original document was not supplied for this investigation. Import defects were reproduced with real generated DOCX files (a 1,317-word base fixture), including custom style IDs and several ordinary occurrences of “conclusion”. No conclusion about whether the user's particular headings were structurally styled is assumed.

## Corrected behaviour

- Import resolves supported heading levels from explicit outline metadata, standard style names/aliases and the inherited style chain. Supported inherited inline formatting is retained too. Body-text overrides remain body text.
- Explicit heading searches prioritise recognised headings and exclude body mentions. Multiple headings require a deliberate choice. If none exist, the app explains the difference and offers ordinary text candidates without automatically choosing one.
- Short bold/all-capital paragraphs can be labelled “possible heading · unstructured paragraph” in results; their document structure and wording are not changed.
- Result buttons provide type, level and nearby text. The mobile result panel opens when a choice is required. Click/tap, “Choose result two”, “Select the first result” or “Choose this result” resolves the target. Next/Previous result only previews a result.
- Compatible formatting operations wait for that choice and then apply to the chosen range. No repeated instruction is needed. Unresolved targets cannot accidentally reuse an earlier selection. Changing the document while a choice waits cancels the pending edit safely.
- Applied formatting uses ProseMirror transactions and is undoable. Compound formatting is separated from prior editing history. Outline selection and subsequent contextual commands use the identified heading.

## Verification

- 41 logic/document tests pass, including the existing suite and 15 new imported-heading/context/undo/export tests.
- 20 desktop/mobile browser workflows pass locally, including all 12 prior regression workflows and eight new heading/recognition-path workflows.
- Production-built JavaScript was additionally tested locally, separately from Vite's development server.
- 12 live production browser tests pass on https://josefa.startright.ng, across desktop and mobile emulation: all eight new heading/recognition-path workflows, two offline/PWA workflows and two create/edit/save/reopen/export regressions. The delivered asset hashes were checked against the production build.
- Cloudflare deployment: `a18cbc2024d84bbfba3efc5f39bac65b` (existing `josefa` Worker). HTTPS remains verified.
- The first immediate live run failed while the application was being checked after rollout; subsequent diagnostics confirmed the matching delivered build and successful import. The import test now waits up to 30 seconds for asynchronous Word loading instead of using the default five-second assertion window. No product error was hidden or suppressed.

## Boundaries

Real microphone audio was not retested in this environment. The unchanged recognition event handler is exercised using explicitly simulated recognition events, not represented as real audio testing. Existing physical-device validation was reported by the product owner.

Purely visual headings remain unstructured. The app explains this and permits explicit selection; it does not invent structural headings. Heading metadata already discarded in previously saved imports cannot be reconstructed by changing the importer alone. Reopening the retained original Word file as a new import applies the improved importer without overwriting saved edits.
