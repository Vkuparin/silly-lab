import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const metadata = JSON.parse(
  execFileSync(
    'cargo',
    [
      'metadata',
      '--offline',
      '--locked',
      '--format-version',
      '1',
      '--filter-platform',
      'x86_64-pc-windows-msvc',
      '--manifest-path',
      'src-tauri/Cargo.toml',
    ],
    { maxBuffer: 20e6, encoding: 'utf8' },
  ),
);
const used = new Set(metadata.resolve.nodes.map((n) => n.id));
let out =
  'Keystrike third-party notices — Windows x64\n\nGenerated from locked dependencies. Runtime: Microsoft WebView2 is supplied\nseparately by Microsoft and is not redistributed in this package.\nBuild-time libraries are conservatively included in this inventory.\n\n';
for (const pkg of metadata.packages
  .filter((p) => used.has(p.id) && p.name !== 'keystrike')
  .sort((a, b) => a.name.localeCompare(b.name))) {
  const dir = path.dirname(pkg.manifest_path);
  out += `\n${'='.repeat(72)}\n${pkg.name} ${pkg.version} — ${pkg.license ?? 'see license file'}\n${pkg.repository ?? pkg.homepage ?? ''}\n`;
  let files = (await readdir(dir)).filter((n) =>
    /^(licen[cs]e|copying|copyright|notice)([._-]|$)/i.test(n),
  );
  if (pkg.license_file && !files.includes(pkg.license_file)) files.push(pkg.license_file);
  for (const name of files) {
    try {
      const text = await readFile(path.join(dir, name), 'utf8');
      out += `\n--- ${name} ---\n${text}\n`;
    } catch {}
  }
}
const api = JSON.parse(await readFile('node_modules/@tauri-apps/api/package.json', 'utf8'));
out += `\n${'='.repeat(72)}\n@tauri-apps/api ${api.version} — ${api.license}\n`;
for (const name of (await readdir('node_modules/@tauri-apps/api')).filter((n) =>
  /^(licen[cs]e|notice)/i.test(n),
)) {
  try {
    out += `\n--- ${name} ---\n${await readFile('node_modules/@tauri-apps/api/' + name, 'utf8')}\n`;
  } catch {}
}
await writeFile('THIRD-PARTY-NOTICES.txt', out);
console.log(`Third-party notices: ${Buffer.byteLength(out)} bytes`);
