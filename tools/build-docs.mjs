import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(projectRoot, process.env.DOCS_SOURCE_DIR || ".docs-source");
const outputRoot = path.resolve(projectRoot, "public", "handbook");
const manifestPath = path.resolve(projectRoot, "src", "data", "doc-manifest.json");
const themeRoot = path.resolve(projectRoot, "tools", "mdbook-theme");
const themeCssPath = path.join(themeRoot, "pc-hospital.css");
const themeJsPath = path.join(themeRoot, "pc-hospital.js");
const summaryPath = path.join(sourceRoot, "src", "SUMMARY.md");
const bookConfigPath = path.join(sourceRoot, "book.toml");
const repoUrl = "https://github.com/ZAFU-PCHospital/ZAFU-PCHospital-Doc";
const buildSourceRoot = mkdtempSync(path.join(tmpdir(), "zafu-pchospital-docs-"));

process.once("exit", () => {
  const resolvedTempRoot = path.resolve(tmpdir());
  const resolvedBuildSource = path.resolve(buildSourceRoot);
  if (resolvedBuildSource.startsWith(`${resolvedTempRoot}${path.sep}`)) {
    rmSync(resolvedBuildSource, { recursive: true, force: true });
  }
});

function fail(message) {
  throw new Error(`[docs:build] ${message}`);
}

function assertSource() {
  if (!existsSync(sourceRoot)) {
    fail(
      `文档源码目录不存在：${sourceRoot}\n` +
        "请设置 DOCS_SOURCE_DIR，或将文档仓库检出到 .docs-source/。",
    );
  }
  if (!existsSync(bookConfigPath)) fail(`缺少 mdBook 配置：${bookConfigPath}`);
  if (!existsSync(summaryPath)) fail(`缺少文档目录：${summaryPath}`);
  if (!existsSync(themeCssPath)) fail(`缺少官网 mdBook 主题样式：${themeCssPath}`);
  if (!existsSync(themeJsPath)) fail(`缺少官网 mdBook 主题脚本：${themeJsPath}`);
}

function toPosix(value) {
  return value.replaceAll("\\", "/");
}

function localMarkdownPath(href) {
  const clean = href.split(/[?#]/, 1)[0].trim();
  if (!clean || /^[a-z][a-z\d+.-]*:/i.test(clean) || clean.startsWith("//")) return null;

  const decoded = decodeURIComponent(clean);
  const relativePath = path.posix.normalize(toPosix(decoded));
  if (
    relativePath === ".." ||
    relativePath.startsWith("../") ||
    path.posix.isAbsolute(relativePath)
  ) {
    fail(`SUMMARY.md 包含越界路径：${href}`);
  }
  return relativePath;
}

function outputCandidates(markdownPath) {
  const parsed = path.posix.parse(markdownPath);
  const standard = path.posix.join(parsed.dir, `${parsed.name}.html`);
  if (parsed.base.toLowerCase() === "readme.md") {
    return [path.posix.join(parsed.dir, "index.html"), standard];
  }
  return [standard];
}

function resolveOutputPath(markdownPath) {
  const candidates = outputCandidates(markdownPath);
  const match = candidates.find((candidate) =>
    existsSync(path.join(outputRoot, ...candidate.split("/"))),
  );
  if (!match) {
    fail(`已就绪条目没有对应的 mdBook HTML：${markdownPath}（检查过 ${candidates.join("、")}）`);
  }
  return match;
}

function markdownDetails(markdownPath, title) {
  const absolutePath = path.join(sourceRoot, "src", ...markdownPath.split("/"));
  if (!existsSync(absolutePath)) fail(`SUMMARY.md 引用了不存在的文件：${markdownPath}`);

  const markdown = readFileSync(absolutePath, "utf8");
  const headingMatch = markdown.match(/^#{1,6}\s+(.+)$/m);
  return {
    title,
    heading: headingMatch?.[1].replaceAll("**", "").trim() || title,
    markdown,
    bytes: Buffer.byteLength(markdown),
  };
}

function parseSummary() {
  const tree = [];
  const pages = {};
  let activeChildren = tree;
  let stack = [{ indent: -1, children: activeChildren }];

  const addEntry = (title, href, indent) => {
    while (stack.length > 1 && stack.at(-1).indent >= indent) stack.pop();

    const markdownPath = localMarkdownPath(href);
    const children = [];
    const node = markdownPath
      ? {
          kind: "page",
          title,
          path: markdownPath,
          outputPath: resolveOutputPath(markdownPath),
          exists: true,
          children,
        }
      : { kind: "pending", title, path: null, children };

    stack.at(-1).children.push(node);
    stack.push({ indent, children });

    if (markdownPath) pages[markdownPath] = markdownDetails(markdownPath, title);
  };

  for (const line of readFileSync(summaryPath, "utf8").split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      if (heading[1].trim().toLowerCase() === "summary") continue;
      const group = { kind: "group", title: heading[1].trim(), path: null, children: [] };
      tree.push(group);
      activeChildren = group.children;
      stack = [{ indent: -1, children: activeChildren }];
      continue;
    }

    const listEntry = line.match(/^(\s*)[-*+]\s+\[([^\]]+)]\(([^)]*)\)\s*$/);
    if (listEntry) {
      const indent = listEntry[1].replaceAll("\t", "    ").length;
      addEntry(listEntry[2].trim(), listEntry[3], indent);
      continue;
    }

    const rootEntry = line.match(/^\[([^\]]+)]\(([^)]*)\)\s*$/);
    if (rootEntry) {
      activeChildren = tree;
      stack = [{ indent: -1, children: activeChildren }];
      addEntry(rootEntry[1].trim(), rootEntry[2], 0);
    }
  }

  return { tree, pages };
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function customizeHtml() {
  const marker = 'data-pc-hospital-return="true"';
  const link =
    `<a href="/docs" class="pc-hospital-return" title="返回电脑医院官网" ${marker}>` +
    `<span aria-hidden="true">←</span><span>电脑医院官网</span></a>`;
  const themeBootstrapMarker = 'data-pc-hospital-theme-bootstrap="true"';
  const themeBootstrap = `<script ${themeBootstrapMarker}>(function(){try{var mode=localStorage.getItem("zafu-pchospital:theme-mode");if(mode==="dark"){localStorage.setItem("mdbook-theme","coal")}else if(mode==="normal"){localStorage.setItem("mdbook-theme","light")}}catch(e){}})();</script>`;
  let injected = 0;

  for (const htmlPath of walkFiles(outputRoot).filter((file) => file.endsWith(".html"))) {
    let html = readFileSync(htmlPath, "utf8");
    if (!html.includes(themeBootstrapMarker) && html.includes("<!-- Custom HTML head -->")) {
      html = html.replace(
        "<!-- Custom HTML head -->",
        `<!-- Custom HTML head -->${themeBootstrap}`,
      );
    }
    if (!html.includes(marker) && html.includes('<div class="left-buttons">')) {
      html = html.replace('<div class="left-buttons">', `<div class="left-buttons">${link}`);
      injected += 1;
    }
    writeFileSync(htmlPath, html);
  }

  const indexHtml = readFileSync(path.join(outputRoot, "index.html"), "utf8");
  if (!injected || !indexHtml.includes(marker) || !indexHtml.includes(themeBootstrapMarker)) {
    fail("无法向 mdBook 加入官网导航或主题引导，请检查当前 mdBook 主题结构");
  }
}

function validateAssets() {
  const files = walkFiles(outputRoot);
  if (!existsSync(path.join(outputRoot, "index.html"))) fail("缺少 public/handbook/index.html");
  if (!files.some((file) => file.endsWith(".js"))) fail("mdBook 产物中没有 JavaScript 资源");
  if (!files.some((file) => file.endsWith(".css"))) fail("mdBook 产物中没有 CSS 资源");
  if (!files.some((file) => /^searchindex(?:[.-])/.test(path.basename(file)))) {
    fail("mdBook 已启用搜索，但产物中没有 searchindex.*");
  }
  if (!files.some((file) => /^pc-hospital(?:[.-]).*\.css$/.test(path.basename(file)))) {
    fail("mdBook 产物中没有电脑医院自定义主题 CSS");
  }
  if (!files.some((file) => /^pc-hospital(?:[.-]).*\.js$/.test(path.basename(file)))) {
    fail("mdBook 产物中没有电脑医院自定义主题 JavaScript");
  }
}

function resolveRevision() {
  if (process.env.DOCS_SHA) return process.env.DOCS_SHA;
  try {
    return execFileSync("git", ["-C", sourceRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "local";
  }
}

function readBookMetadata() {
  const config = readFileSync(bookConfigPath, "utf8");
  const bookSection = config.match(/\[book]\s*([\s\S]*?)(?=\n\s*\[|$)/)?.[1] ?? "";
  const scalar = (key, fallback) =>
    bookSection.match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1] ?? fallback;
  const authors = bookSection
    .match(/^\s*authors\s*=\s*\[([^\]]*)]/m)?.[1]
    ?.split(",")
    .map((author) => author.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  return {
    title: scalar("title", "ZAFU-PCHospital-Doc"),
    authors: authors?.length ? authors : ["RepentStar"],
    language: scalar("language", "zh-Hans-CN"),
  };
}

function stripEmptyChildren(nodes) {
  return nodes.map((node) => {
    if (!node.children?.length) {
      return Object.fromEntries(Object.entries(node).filter(([key]) => key !== "children"));
    }
    return { ...node, children: stripEmptyChildren(node.children) };
  });
}

function countEntries(nodes) {
  let ready = 0;
  let pending = 0;
  for (const node of nodes) {
    if (node.kind === "page") ready += 1;
    if (node.kind === "pending") pending += 1;
    if (node.children) {
      const nested = countEntries(node.children);
      ready += nested.ready;
      pending += nested.pending;
    }
  }
  return { ready, pending };
}

assertSource();

cpSync(sourceRoot, buildSourceRoot, {
  recursive: true,
  filter(source) {
    const relativePath = path.relative(sourceRoot, source);
    if (!relativePath) return true;
    const firstSegment = relativePath.split(path.sep)[0];
    return firstSegment !== ".git" && firstSegment !== "book";
  },
});
copyFileSync(themeCssPath, path.join(buildSourceRoot, "pc-hospital.css"));
copyFileSync(themeJsPath, path.join(buildSourceRoot, "pc-hospital.js"));

if (outputRoot !== path.resolve(projectRoot, "public", "handbook")) {
  fail(`拒绝清理非预期目录：${outputRoot}`);
}
rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

console.log(`[docs:build] source: ${sourceRoot}`);
execFileSync(
  process.env.MDBOOK_BIN || "mdbook",
  ["build", buildSourceRoot, "--dest-dir", outputRoot],
  {
    cwd: projectRoot,
    env: {
      ...process.env,
      MDBOOK_OUTPUT__HTML__SITE_URL: '"/handbook/"',
      MDBOOK_OUTPUT__HTML__DEFAULT_THEME: '"light"',
      MDBOOK_OUTPUT__HTML__PREFERRED_DARK_THEME: '"coal"',
      MDBOOK_OUTPUT__HTML__ADDITIONAL_CSS: '["pc-hospital.css"]',
      MDBOOK_OUTPUT__HTML__ADDITIONAL_JS: '["pc-hospital.js"]',
    },
    stdio: "inherit",
  },
);

const cnamePath = path.join(outputRoot, "CNAME");
if (existsSync(cnamePath) && statSync(cnamePath).isFile()) rmSync(cnamePath);

validateAssets();
customizeHtml();

const { tree, pages } = parseSummary();
const counts = countEntries(tree);
const sourceRevision = resolveRevision();
const bookMetadata = readBookMetadata();
const manifest = {
  meta: {
    ...bookMetadata,
    repoUrl,
    sourceRevision,
    generatedAt: new Date().toISOString(),
    counts: { total: counts.ready + counts.pending, ...counts },
  },
  tree: stripEmptyChildren(tree),
  pages,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[docs:build] revision: ${sourceRevision}`);
console.log(`[docs:build] manifest: ${counts.ready} ready / ${counts.pending} pending`);
console.log(`[docs:build] output: ${outputRoot}`);
