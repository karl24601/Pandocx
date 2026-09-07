#!/usr/bin/env node
/*
 * Regenerates the embedded copy of zotero.lua inside main.js.
 *
 * The filter has to be embedded because BRAT and Obsidian's community plugin
 * installer only download main.js, manifest.json and styles.css from a release
 * — zotero.lua would never reach the user's plugin folder otherwise.
 *
 * It is stored base64-encoded rather than as a template literal: the filter
 * contains backticks, and base64 guarantees a byte-exact round trip.
 *
 * Usage:  node tools/embed-filter.js [path/to/zotero.lua]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const source = process.argv[2] || path.join(root, 'zotero.lua');
const target = path.join(root, 'main.js');

const lua = fs.readFileSync(source);
const md5 = crypto.createHash('md5').update(lua).digest('hex');
const b64 = lua.toString('base64');

// 76 字符一行，避免 main.js 出现一条几万字符的长行
const chunks = (b64.match(/.{1,76}/g) || []).map((c) => `  '${c}',`).join('\n');

const revision =
  (lua.toString('utf8').match(/zotero-live-citations\s+(\w+)/) || [])[1] || 'unknown';

const block =
  `const FILTER_REVISION = '${revision}';\n` +
  `const FILTER_MD5 = '${md5}';\n` +
  `const DEFAULT_FILTER_B64 = [\n${chunks}\n].join('');`;

let main = fs.readFileSync(target, 'utf8');
const start = main.indexOf('/* @generated-filter-start */');
const end = main.indexOf('/* @generated-filter-end */');
if (start === -1 || end === -1) {
  console.error('Could not find the generated-filter markers in main.js');
  process.exit(1);
}

main =
  main.slice(0, start) +
  '/* @generated-filter-start */\n' +
  block +
  '\n' +
  main.slice(end);

fs.writeFileSync(target, main);
console.log(`embedded ${source}`);
console.log(`  revision ${revision}`);
console.log(`  md5      ${md5}`);
console.log(`  ${lua.length} bytes -> ${b64.length} base64 chars`);
