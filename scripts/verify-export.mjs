import fs from "node:fs";
import assert from "node:assert/strict";
const sw = fs.readFileSync("out/sw.js", "utf8"),
  match = sw.match(/const PRECACHE = (\[[\s\S]*?\]);/);
assert(match, "Generated offline resource list missing");
const paths = JSON.parse(match[1]);
assert(paths.some((p) => p.endsWith(".js")));
assert(paths.some((p) => p.includes("chunks") && p.endsWith(".js")));
for (const p of paths)
  assert(
    fs.existsSync(p === "/" ? "out/index.html" : "out" + p),
    `Missing precached resource ${p}`,
  );
const manifest = JSON.parse(
  fs.readFileSync("out/manifest.webmanifest", "utf8"),
);
assert(manifest.display === "standalone");
for (const icon of manifest.icons) assert(fs.existsSync("out" + icon.src));
assert(!sw.includes("eleven-shell-development"));
const html = fs.readFileSync("out/index.html", "utf8");
for (const match of html.matchAll(
  /(?:src|href)="(\/_next\/[^"?]+)(?:\?[^"\s]*)?"/g,
))
  assert(fs.existsSync("out" + match[1]), `Missing HTML asset ${match[1]}`);
console.log(
  `Export verified: ${paths.length} offline resources, manifest icons and initial HTML assets present.`,
);
