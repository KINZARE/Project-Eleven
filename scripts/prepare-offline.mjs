import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const assets = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (
      /\.(js|css|woff2|png|webmanifest)$/.test(p) &&
      !p.endsWith("/sw.js")
    )
      assets.push("/" + p.replace(/^out\//, ""));
  }
}
walk("out");
assets.unshift("/");
const hash = createHash("sha256");
for (const f of assets)
  hash.update(fs.readFileSync(f === "/" ? "out/index.html" : "out" + f));
const digest = hash.digest("hex").slice(0, 12);
const template = fs
  .readFileSync("public/sw.js", "utf8")
  .replace(
    /const CACHE = [\s\S]*?;/,
    `const CACHE = ${JSON.stringify("eleven-shell-" + digest)};`,
  )
  .replace(
    /const PRECACHE = [\s\S]*?;/,
    `const PRECACHE = ${JSON.stringify(assets)};`,
  );
fs.writeFileSync("out/sw.js", template);
console.log(`Offline shell: ${assets.length} resources, build ${digest}`);
