// Builds the static pages. Run: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s) {
  return esc(s)
    .replace(/\{\{SUPPORT_EMAIL\}\}/g, '<span data-support></span>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function md(src) {
  const out = []; let list = false; let title = ""; let meta = "";
  for (const line of src.split("\n")) {
    const t = line.trim();
    if (list && !t.startsWith("- ")) { out.push("</ul>"); list = false; }
    if (!t) continue;
    if (t.startsWith("# ")) title = t.slice(2);
    else if (/^Effective /.test(t) && !meta) meta = t;
    else if (t.startsWith("## ")) out.push(`<h2>${inline(t.slice(3))}</h2>`);
    else if (t.startsWith("- ")) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(t.slice(2))}</li>`); }
    else out.push(`<p>${inline(t)}</p>`);
  }
  if (list) out.push("</ul>");
  return { title, meta, html: out.join("\n") };
}

const NAV = [["#how", "How it works"], ["#features", "Features"], ["#pricing", "Pricing"], ["#privacy", "Privacy"]];

function page({ depth, title, description, body }) {
  const up = depth ? "../".repeat(depth) : "./";
  const home = up;
  const links = NAV.map(([h, l]) => `<li><a href="${home}${h}">${l}</a></li>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fbfbfd" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://carboy285.github.io/roadmap-site/assets/icon-512.png">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="${up}assets/favicon.png">
<link rel="apple-touch-icon" href="${up}assets/apple-touch-icon.png">
${depth === 0 ? `<style>${read("assets/site.css").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/ ?([{};,]) ?/g, "$1")}</style>` : `<link rel="stylesheet" href="${up}assets/site.css">`}
</head>
<body>
<nav class="nav" aria-label="Main">
  <div class="wrap">
    <a class="brand" href="${home}"><img src="${up}assets/favicon.png" alt="" width="28" height="28">Roadmap</a>
    <ul>${links}<li><a class="btn sm" href="${up}support/">Support</a></li></ul>
  </div>
</nav>
<main>
${body.replace(/(href|src)="(?!https?:|#|\.\.\/|\.\/|mailto:)/g, `$1="${depth ? up : ""}`)}
</main>
<footer>
  <div class="wrap">
    <span>© 2026 Roadmap. Not affiliated with Apple, Google or your school.</span>
    <nav aria-label="Footer"><a href="${up}privacy/">Privacy</a><a href="${up}terms/">Terms</a><a href="${up}eula/">License</a><a href="${up}licenses/">Open source</a><a href="${up}support/">Support</a></nav>
  </div>
</footer>
<script src="${up}assets/config.js" defer></script>
<script src="${up}assets/site.js" defer></script>
</body>
</html>
`;
}

function write(rel, html) {
  const f = join(root, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, html);
}

const DESC = "Roadmap turns an assignment into a short checklist, fits it into your week, and keeps your due dates. For high school students on iPhone.";
write("index.html", page({ depth: 0, title: "Roadmap: know what to work on next", description: DESC, body: read("content/home.html") }));

for (const [slug, desc] of [["privacy", "How Roadmap collects, uses and protects your information."], ["terms", "The terms for using Roadmap."], ["eula", "The license agreement for the Roadmap app."], ["licenses", "Open-source software and AI models used by Roadmap."]]) {
  const d = md(read(`content/${slug}.md`));
  const body = `<article class="wrap doc"><nav class="toc" aria-label="Policies">${[["privacy", "Privacy"], ["terms", "Terms"], ["eula", "License"], ["licenses", "Open source"], ["support", "Support"]].map(([s, l]) => `<a href="../${s}/"${s === slug ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav><h1>${esc(d.title)}</h1>${d.meta ? `<p class="meta">${esc(d.meta)}</p>` : '<p class="meta"></p>'}\n${d.html}</article>`;
  write(`${slug}/index.html`, page({ depth: 1, title: `${d.title} · Roadmap`, description: desc, body }));
}

const sup = `<article class="wrap doc"><nav class="toc" aria-label="Policies">${[["privacy", "Privacy"], ["terms", "Terms"], ["eula", "License"], ["licenses", "Open source"], ["support", "Support"]].map(([s, l]) => `<a href="../${s}/"${s === "support" ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>${read("content/support.html")}</article>`;
write("support/index.html", page({ depth: 1, title: "Support · Roadmap", description: "Get help with Roadmap for iPhone.", body: sup }));
{
  const t = read("content/eula.md").split("\n").map((l) => l.replace(/^#{1,2} /, "").replace(/\*\*(.+?)\*\*/g, "$1")).join("\n");
  write("eula.txt", t.replace(/^License Agreement\n/, "LICENSE AGREEMENT\n"));
}
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["", "privacy/", "terms/", "eula/", "licenses/", "support/"].map((p) => `<url><loc>https://carboy285.github.io/roadmap-site/${p}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", "User-agent: *\nAllow: /\nSitemap: https://carboy285.github.io/roadmap-site/sitemap.xml\n");
console.log("built");
