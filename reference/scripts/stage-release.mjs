import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  copyFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("data/manifest.json", dist), "utf8"),
);
// Staging never writes research files. Verify the release against the existing sources first.
for (const [name, hash] of Object.entries(manifest.sourceHashes)) {
  for (const base of [new URL("data/", root), new URL("data/", dist)]) {
    const bytes = await readFile(new URL(name, base));
    if (createHash("sha256").update(bytes).digest("hex") !== hash)
      throw new Error(`Research mismatch: ${name}`);
  }
}
await mkdir(new URL("assets/", root), { recursive: true });
for (const file of await readdir(new URL("assets/", dist)))
  await copyFile(
    new URL(`assets/${file}`, dist),
    new URL(`assets/${file}`, root),
  );
await copyFile(new URL("index.html", dist), new URL("index.html", root));
await copyFile(new URL("THIRD_PARTY_NOTICES.txt", dist), new URL("THIRD_PARTY_NOTICES.txt", root));
await writeFile(
  new URL("data/manifest.json", root),
  JSON.stringify(manifest, null, 2),
);
await writeFile(new URL(".nojekyll", root), "");
console.log(
  "Staged static application at repository root. Original research assets unchanged. Review and commit before pushing main.",
);
