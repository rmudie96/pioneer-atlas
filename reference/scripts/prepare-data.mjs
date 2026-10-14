import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const sourceDir = new URL("../../data/", import.meta.url);
const outputDir = new URL("../public/data/", import.meta.url);
await mkdir(new URL("neighbourhoods/", outputDir), { recursive: true });
const hashes = {};
const files = [
  "ttwa-summary.json",
  "ttwa-boundaries.json",
  "national-summary.json",
  "industry-options.json",
];
const places = JSON.parse(await readFile(new URL(files[0], sourceDir), "utf8"));
const options = JSON.parse(
  await readFile(new URL(files[3], sourceDir), "utf8"),
);
const extension = JSON.parse(await readFile(new URL("../public/context/exploration-extension.json", import.meta.url), "utf8"));
if (extension.version !== "exploration-2026-10-14" || extension.additionalDiversification.length !== 1195 || extension.further.length !== 1490)
  throw new Error("Exploration extension is missing or does not match this release.");
for (const p of places) {
  if (extension.further.filter(o => o.ttwaCode === p.code).length !== 10)
    throw new Error(`Exploration coverage incomplete: ${p.code}`);
}
if (places.length !== 149 || options.length !== 2643)
  throw new Error(
    "Research release membership changed; review before publishing.",
  );
for (const p of places) {
  const rows = options.filter((o) => o.ttwaCode === p.code);
  if (!rows.length || rows.length > 20 || rows.length > p.candidateOptions)
    throw new Error(`Invalid published portfolio: ${p.code}`);
  files.push(`neighbourhoods/${p.code}.json`);
}
for (const file of files) {
  const bytes = await readFile(new URL(file, sourceDir));
  hashes[file] = createHash("sha256").update(bytes).digest("hex");
  await writeFile(new URL(file, outputDir), bytes);
}
await writeFile(
  new URL("manifest.json", outputDir),
  JSON.stringify(
    {
      sourceCommit: "f77e59d",
      scope:
        "149 whole-place summaries; 2,643 published leading propositions; 149 unchanged neighbourhood maps. Portfolio totals include 5,889 candidates.",
      sourceHashes: hashes,
    },
    null,
    2,
  ),
);
console.log(
  "Prepared all 149 places, 2,643 unchanged propositions and 149 neighbourhood maps.",
);
