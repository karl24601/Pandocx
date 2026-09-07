# Pandocx

Export Obsidian notes to Word (`.docx`) via [Pandoc](https://pandoc.org/), with a bundled Lua filter for Zotero citations.

Pandocx is a thin, predictable wrapper around one command:

```bash
pandoc <current note>.md -s --lua-filter=<plugin folder>/zotero.lua -o <name>.docx
```

You press a hotkey, confirm the output file name, and get a `.docx`. That's the whole plugin.

## Why

Obsidian's built-in export and most Markdown→Word plugins ignore citation keys. If you write with Zotero (`@smith2020`, Better BibTeX keys, etc.), you need Pandoc in the pipeline — and once Pandoc is involved you also want a Lua filter to shape the citations. Pandocx bundles that filter and takes the command line out of your way.

## Requirements

- Desktop Obsidian (the plugin shells out to Pandoc, so it cannot run on mobile)
- [Pandoc](https://pandoc.org/installing.html) 2.16.2 or later
- [Zotero](https://www.zotero.org/) running, with [Better BibTeX](https://retorque.re/zotero-better-bibtex/) installed

The bundled filter produces **live citation fields**, not static text: it queries your running Zotero instance over `127.0.0.1:23119` while Pandoc converts, and writes Word fields that Zotero's Word add-in can later refresh, restyle, or turn into a bibliography. Zotero has to be open at export time.

## Installation

Not yet in the community plugin browser.

### Via BRAT (recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) installs the plugin from this repository and keeps it updated automatically.

1. Install and enable **BRAT** from Settings → Community plugins → Browse.
2. Run the command **BRAT: Add a beta plugin for testing**.
3. Enter `karl24601/Pandocx` and confirm.
4. Enable **Pandocx** under Settings → Community plugins.

BRAT only fetches `main.js`, `manifest.json` and `styles.css`, so `zotero.lua` is not downloaded. Pandocx handles this: it writes a placeholder `zotero.lua` into its own plugin folder on first launch. **Replace that file with your own filter** — the path is `<vault>/.obsidian/plugins/pandocx/zotero.lua`.

The placeholder is only ever created when the file is missing, so your own filter is never overwritten, including on updates.

### Manual

1. Download `main.js`, `manifest.json` and `zotero.lua` from the [latest release](../../releases/latest).
2. Put them in `<vault>/.obsidian/plugins/pandocx/`.
3. **Replace `zotero.lua` with your own filter.** The shipped file is a no-op placeholder. Keep the file name unchanged.
4. Restart or reload Obsidian, then enable **Pandocx** under Settings → Community plugins.

## Usage

Three ways to trigger an export, all of which open a dialog pre-filled with the current note's name:

- Command palette → **Export current note to DOCX**
- The ribbon icon in the left sidebar
- Right-click a note in the file explorer → **Export to DOCX with Pandoc**

Press Enter in the dialog to export. Assigning a hotkey to the command is worth the ten seconds.

The name you type is the **output** name only — the input is always the note you have open, so renaming the export never touches the source file.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Pandoc path | `pandoc` | Set an absolute path if Pandoc is not found |
| Extra arguments | `-s` | e.g. `--reference-doc="My Template.docx" --toc` |
| Output folder | *(empty)* | Empty = next to the source note. Absolute or vault-relative |
| Save note before exporting | on | Prevents exporting stale editor content |
| Open after exporting | off | Opens the `.docx` in your default application |

Arguments are passed to Pandoc as an argument array rather than through a shell, so spaces, quotes and non-ASCII characters in file names are handled correctly.

## Troubleshooting

**"Pandoc not found"** — On macOS and Linux, a GUI-launched Obsidian does not inherit your login shell's `PATH`. Pandocx already appends the usual locations (`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, …). If it still fails, run `which pandoc` in a terminal and paste the full path into the settings.

**"Could not reach Zotero"** — Zotero is not running, or Better BibTeX is not installed. The filter needs a live connection to resolve citation keys; there is no offline mode.

**`new version "Host not i" available`** — A cosmetic bug in the upstream filter's version check when it cannot reach the network. Harmless; it appears in the console only.

**Citations come out as `<Do Zotero Refresh: ...>`** — This is correct. The filter writes Word *fields*, not formatted text. Open the `.docx` in Word and click **Refresh** on the Zotero tab; Zotero then renders the citations, and produces footnotes if your CSL style is note-based.

**No footnotes** — Set a note-based style in the note's front matter. The default is `apa`, which is an author-date style and never produces footnotes:

```yaml
---
zotero:
  csl-style: chicago-note-bibliography
---
```

**Upgraded from 1.0.0 and citations are untouched** — 1.0.0 shipped a no-op placeholder `zotero.lua`, and updates never overwrite an existing filter, so the placeholder survived. Pandocx detects and replaces it automatically. To fix it by hand, delete `zotero.lua` from the plugin folder and reload Obsidian.

**Citations stay as `[@citekey]`** — The key was not resolved. Pandocx surfaces the filter's own diagnostics as a notice; the full output is in the developer console under `[pandocx] filter output`.

**Export fails and the notice is truncated** — The notice shows the first 800 characters. The full Pandoc stderr is in the developer console (`Ctrl`/`Cmd` + `Shift` + `I`).

**Images are missing** — Pandoc runs with the note's folder as its working directory, and `--resource-path` is set to that folder plus the vault root. Images outside both need an explicit `--resource-path` entry in the extra arguments.

**Wikilinks and `![[embeds]]` come out as literal text** — Pandoc does not understand Obsidian-specific syntax. Handle it in your Lua filter, or chain another filter via the extra arguments.

**Existing files are overwritten** — Pandoc overwrites a same-named `.docx` without prompting.

**The filter reverts to the placeholder** — Pandocx only writes `zotero.lua` when the file is absent, so this means the file went missing rather than being replaced. Reinstalling the plugin folder from scratch will do it. Keep a copy of your filter outside the plugin folder.

## Development

`main.js` is plain CommonJS with no build step. Edit it and reload Obsidian.

## Credits

The bundled `zotero.lua` is the **zotero-live-citations** filter from [Better BibTeX for Zotero](https://retorque.re/zotero-better-bibtex/exporting/pandoc/) by Emiliano Heyns, redistributed unmodified (revision `199d652`). All citation handling is its work; Pandocx only ships it and invokes Pandoc.

To update it, drop a newer `zotero.lua` in the repository root and run:

```bash
node tools/embed-filter.js
```

That regenerates the embedded copy in `main.js` and prints the new revision and checksum.

## License

Pandocx is MIT licensed. The bundled `zotero.lua` is distributed under its own license from the Better BibTeX project — see that project for terms.
