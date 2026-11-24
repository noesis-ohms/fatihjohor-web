// Builds knowledge.txt from the website's HTML pages so the assistant
// answers from the same facts the site shows. Runs at Docker build time.
import fs from "node:fs";
import path from "node:path";

const siteDir = process.argv[2] || "..";
const outFile = process.argv[3] || "knowledge.txt";

// Internal / duplicate pages that add nothing for visitors.
const SKIP = new Set(["admin.html", "appointment-review.html", "og-home.html", "join-us.html"]);

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => entities[n.toLowerCase()] ?? m);

function pageText(html) {
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "").trim();
  let body = html
    .replace(/<(script|style|noscript|svg|head|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|p|div|li|h[1-6]|tr|section|article|header|footer|nav|ul|ol|table|dt|dd)\b[^>]*>/gi, "\n")
    .replace(/<a\b[^>]*href="(https:\/\/wa\.me\/[^"?]+|tel:[^"]+)"[^>]*>/gi, " [$1] ")
    .replace(/<[^>]+>/g, " ");
  body = decode(body);
  const lines = body
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 1);
  return { title, lines };
}

const files = [];
for (const entry of fs.readdirSync(siteDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".html")) files.push(entry.name);
  else if (entry.isDirectory() && !entry.name.startsWith(".") && !["node_modules", "chatbot", "assets", "index_files"].includes(entry.name)) {
    for (const sub of fs.readdirSync(path.join(siteDir, entry.name))) {
      if (sub.endsWith(".html")) files.push(`${entry.name}/${sub}`);
    }
  }
}
files.sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b)));

// Lines repeated across pages (menus, footers) are kept only the first time.
const seen = new Set();
let out = "";
const panelNames = [];
let panelTemplateDone = false;
for (const file of files) {
  if (SKIP.has(file)) continue;
  // Health articles are general reading, not clinic facts.
  if (file.startsWith("blog-kesihatan/")) continue;
  // Panel pages share one template: keep the first in full, then just list the names.
  if (file.startsWith("panel/")) {
    if (panelTemplateDone) {
      const { title } = pageText(fs.readFileSync(path.join(siteDir, file), "utf8"));
      panelNames.push(`${title.split("|")[0].replace(/Panel Clinic.*/i, "").trim()} (https://klinikalfatihjohor.com/${file})`);
      continue;
    }
    panelTemplateDone = true;
  }
  const { title, lines } = pageText(fs.readFileSync(path.join(siteDir, file), "utf8"));
  // Drop sentences already seen on earlier pages (shared FAQs, footers), and
  // self-assessment questionnaire items, which are not clinic facts.
  const fresh = lines
    .filter((l) => !/^\d{1,2} (Saya|Tidak langsung|Sedikit|Agak kerap|Sangat kerap)/.test(l))
    .map((l) =>
      l
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => {
          if (sentence.length < 20) return true;
          if (seen.has(sentence)) return false;
          seen.add(sentence);
          return true;
        })
        .join(" "),
    )
    .filter((l) => {
      if (!l || seen.has("line:" + l)) return false;
      seen.add("line:" + l);
      return true;
    });
  if (!fresh.length) continue;
  out += `\n\n=== PAGE: https://klinikalfatihjohor.com/${file === "index.html" ? "" : file} | ${title} ===\n`;
  out += fresh.join("\n");
}

if (panelNames.length) {
  out += "\n\n=== OTHER PANELS LISTED IN THE CLINIC PANEL DIRECTORY (same rules as the panel page above: listed, eligibility must be checked) ===\n";
  out += panelNames.join("\n");
}
fs.writeFileSync(outFile, out.trim() + "\n");
console.log(`Wrote ${outFile}: ${files.length} pages, ${out.length} chars`);
