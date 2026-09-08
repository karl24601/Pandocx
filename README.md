# Pandocx

Export Obsidian notes to Word (`.docx`) via [Pandoc](https://pandoc.org/), with a bundled Lua filter for Zotero citations.

Pandocx is a thin, predictable wrapper around one command:

```bash
pandoc <current note>.md -s --lua-filter=<plugin folder>/zotero.lua -o <name>.docx
```

You press a hotkey, confirm the output file name, and get a `.docx`. That's the whole plugin.

## Why

Pandoc's own citation processor cannot parse CSL styles that define more than one `<layout>`. Feed it such a style and it fails outright:

```
CiteprocParseError: Multiple layout elements present in bibliography
```

Multiple layouts are a CSL-M extension, and they are exactly what bilingual styles rely on — a Chinese-language source and a Western-language source have to be formatted differently within one bibliography. The GB/T 7714 family of styles is built this way, as are many of the house styles used in Chinese legal and humanities scholarship. Support for these layouts is [still open upstream](https://github.com/jgm/citeproc/issues/120).

Zotero's own processor handles them without trouble. So instead of asking Pandoc to render citations, this plugin uses Better BibTeX's Lua filter to write **live Zotero fields** into the `.docx`, and Zotero formats them when you refresh in Word — the same code path as citations inserted through Word's Zotero add-in, with the same style support.

Which means the workflow is: draft in Obsidian with Better BibTeX citation keys, export, refresh in Word. Pandocx bundles the filter and takes the command line out of the way.

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

BRAT only fetches `main.js`, `manifest.json` and `styles.css`, so `zotero.lua` is never downloaded. Pandocx handles this: the filter is embedded in `main.js` and written to `<vault>/.obsidian/plugins/pandocx/zotero.lua` on first launch. Nothing to configure — citations work out of the box.

If you want a modified filter, overwrite that file. Pandocx only writes it when it is missing, so your version survives updates.

### Manual

1. Download `main.js`, `manifest.json` and `zotero.lua` from the [latest release](../../releases/latest).
2. Put them in `<vault>/.obsidian/plugins/pandocx/`.
3. Restart or reload Obsidian, then enable **Pandocx** under Settings → Community plugins.

`zotero.lua` is the working Better BibTeX filter, not a stub — no substitution needed. To use a modified filter, overwrite that file and keep the name unchanged.

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

## Matching your institution's formatting

Pandoc's default `.docx` output uses generic styling. To make every export come out in your department's required format — typeface, line spacing, heading levels, footnote size, margins — point Pandoc at a reference document:

```
-s --reference-doc="/path/to/thesis-template.docx"
```

Pandoc reads **style definitions and page setup** from that file and ignores its text, so you configure the format once and every export inherits it.

To build one:

1. Generate Pandoc's default template — you only ever do this once:

   ```bash
   pandoc -o thesis-template.docx --print-default-data-file reference.docx
   ```

2. Open it in Word and edit the **style definitions** themselves (Styles pane → right-click a style → Modify). Selecting text and changing its font does not work: Pandoc reads the styles, not the formatting of individual runs.

   The ones that usually matter: `Normal` for body text, `Heading 1`–`Heading 3`, `Footnote Text`, `Title`, `Author`, and `Block Text` for block quotations. Margins, paper size and headers/footers carry over from this file too.

3. Save it outside your vault — a synced folder invites conflicts — and put the path in **Extra arguments**. Quote it if it contains spaces.

This pairs well with Zotero: refreshed citations are formatted with Word's `Footnote Text` style, so setting that style in the template makes footnotes come out right without further intervention.

### Other arguments worth knowing

| Argument                                                | Effect                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `--toc --toc-depth=3`                                   | Inserts a table of contents field. You may need to press F9 in Word to populate it |
| `-t docx+native_numbering` | Numbers figure and table captions (`Figure 1: …`) as real Word `SEQ` fields. The label comes from Pandoc's translation data and there is no Chinese one, so under `-M lang=zh` it vanishes rather than becoming 图 unless you supply your own `translations/zh.yaml` via `--data-dir`. Note that `pandoc-fignos`, which older guides recommend for this, [does not work on Pandoc 3.x](https://github.com/tomduck/pandoc-fignos/issues/107) — it was last tested against Pandoc 2.11 and aborts before producing a file |

Markdown footnotes (`[^1]`) already become real Word footnotes without any extra arguments — useful for explanatory notes that are not citations.

Do not combine `--citeproc`, `--bibliography` or `--csl` with the bundled filter. Those switch on Pandoc's own citation processing, which conflicts with the live Zotero fields — and, for multi-layout styles, is the thing this plugin exists to avoid.

## Troubleshooting

**"Pandoc not found"** — On macOS and Linux, a GUI-launched Obsidian does not inherit your login shell's `PATH`. Pandocx already appends the usual locations (`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, …). If it still fails, run `which pandoc` in a terminal and paste the full path into the settings.

**"Could not reach Zotero"** — Zotero is not running, or Better BibTeX is not installed. The filter needs a live connection to resolve citation keys; there is no offline mode.

**`new version "Host not i" available`** — A cosmetic bug in the upstream filter's version check when it cannot reach the network. Harmless; it appears in the console only.

**Citations come out as `<Do Zotero Refresh: ...>`** — This is correct. The filter writes Word *fields*, not formatted text. Open the `.docx` in Word and click **Refresh** on the Zotero tab; Zotero then renders the citations, and produces footnotes if your CSL style is note-based.

**No footnotes** — For `.docx` the citation style is not carried in the file: the filter writes the style preference only for ODT output. Pick the style on Word's Zotero tab instead, and choose a note-based one (Chicago note-bibliography, GB/T 7714, and so on) if you want footnotes rather than in-text citations.

**Citations stay as `[@citekey]`** — The key was not resolved. Pandocx surfaces the filter's own diagnostics as a notice; the full output is in the developer console under `[pandocx] filter output`.

**Export fails and the notice is truncated** — The notice shows the first 800 characters. The full Pandoc stderr is in the developer console (`Ctrl`/`Cmd` + `Shift` + `I`).

**Images and wikilinks come out as literal text** — Pandoc does not understand Obsidian's `[[…]]` syntax. An image written as `![[picture.png]]` is dropped and the brackets appear as text; standard Markdown images (`![](picture.png)`) embed correctly whether the path is relative to the note, relative to the vault root, or absolute. The simplest fix is Settings → Files and links → turn off **Use [[Wikilinks]]**, which makes Obsidian write Markdown links from then on. Existing notes need converting, or a filter of your own chained through the extra arguments.

**`Could not fetch resource …: replacing image with description`** — The file genuinely is not there. Pandoc warns and carries on, so the export still succeeds, just without that image.

**Existing files are overwritten** — Pandoc overwrites a same-named `.docx` without prompting.

**A modified filter reverted to the bundled one** — Pandocx rewrites `zotero.lua` only when the file is absent, so this means it went missing rather than being replaced; wiping and reinstalling the plugin folder will do it. If you maintain your own edits, keep a copy outside the plugin folder.

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
