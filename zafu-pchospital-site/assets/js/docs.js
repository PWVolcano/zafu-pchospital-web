/* =========================================================================
   内置文档仓库阅读器
   数据来源：docs/doc-data.js（由 tools/build_doc_data.py 生成）
   路由：location.hash = "#doc" 或 "#doc/ZAFUNetWork/Login.md"
   ========================================================================= */
(function () {
  "use strict";

  var DATA = window.ZAFU_DOC_DATA;
  var DOC_ROOT = "docs/src/";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var reader = document.getElementById("reader");
  var readerBody = document.getElementById("readerBody");
  var readerNav = document.getElementById("readerNav");
  var readerNavToggle = document.getElementById("readerNavToggle");
  var readerScrim = document.getElementById("readerScrim");
  var readerClose = document.getElementById("readerClose");
  var readerArticle = document.getElementById("readerArticle");
  var readerMain = document.getElementById("readerMain");
  var readerPath = document.getElementById("readerPath");
  var readerTree = document.getElementById("readerTree");
  var readerProgress = document.getElementById("readerProgress");
  var readerFoot = document.getElementById("readerFoot");
  var preview = document.getElementById("docPreview");

  if (!reader || !readerArticle) return;

  /* ------------------------------------------------------------ 工具 */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>';
  var ICON_FILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
  var ICON_EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';
  var ICON_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

  function svgSpan(markup) {
    var s = document.createElement("span");
    s.innerHTML = markup;
    return s.firstElementChild;
  }

  function resolveRel(baseDir, rel) {
    var stack = baseDir.split("/").filter(Boolean);
    rel.split("/").forEach(function (seg) {
      if (seg === "" || seg === ".") return;
      if (seg === "..") stack.pop();
      else stack.push(seg);
    });
    return stack.join("/");
  }

  function dirOf(p) {
    var i = String(p).lastIndexOf("/");
    return i === -1 ? "" : p.slice(0, i + 1);
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ------------------------------------------------ 展开目录树索引 */
  var flat = [];        // { path, title, group }
  var byPath = {};

  function walk(nodes, groupTrail) {
    (nodes || []).forEach(function (n) {
      if (n.kind === "group") {
        walk(n.children, groupTrail.concat([n.title]));
        return;
      }
      var rec = {
        path: n.path || null,
        title: n.title,
        exists: !!n.exists,
        kind: n.kind,
        group: groupTrail.join(" / ")
      };
      if (rec.path) byPath[rec.path] = rec;
      flat.push(rec);
      if (n.children && n.children.length) walk(n.children, groupTrail.concat([n.title]));
    });
  }
  if (DATA && DATA.tree) walk(DATA.tree, []);

  var firstReady = flat.filter(function (r) { return r.exists; })[0] || null;

  /* ------------------------------------------------------- 渲染目录 */
  var linkRefs = [];   // 所有可跳转的目录条目（阅读器侧栏 + 首页预览）

  function makeItem(rec, forReader) {
    var cls = forReader ? "doclink" : "docpreview__item";
    if (!rec.exists) cls += " is-pending";
    var node;

    if (rec.exists) {
      node = el("button", cls);
      node.type = "button";
      node.setAttribute("data-path", rec.path);
      node.addEventListener("click", function () { go(rec.path); });
      linkRefs.push(node);
    } else {
      node = el("span", cls);
      node.setAttribute("aria-disabled", "true");
      node.title = "该文档尚未撰写";
    }

    node.appendChild(svgSpan(ICON_FILE));
    node.appendChild(el("span", null, rec.title));
    if (!forReader && !rec.exists) node.appendChild(el("em", null, "待撰写"));
    return node;
  }

  function buildTreeList(container, forReader) {
    container.textContent = "";
    (DATA.tree || []).forEach(function (n) {
      if (n.kind === "group") {
        if (forReader) container.appendChild(el("li", "reader__group", n.title));
        else container.appendChild(el("li", "docpreview__group", n.title));
        (n.children || []).forEach(function (c) {
          container.appendChild(listWrap(c, forReader));
        });
      } else {
        container.appendChild(listWrap(n, forReader));
      }
    });
  }

  function listWrap(n, forReader) {
    var li = el("li");
    li.appendChild(makeItem({
      path: n.path || null,
      title: n.title,
      exists: !!(n.path && n.exists),
      kind: n.path ? "page" : "pending"
    }, forReader));
    if (n.children && n.children.length) {
      var sub = el("ul");
      if (forReader) sub.style.paddingLeft = "1rem";
      n.children.forEach(function (c) { sub.appendChild(listWrap(c, forReader)); });
      li.appendChild(sub);
    }
    return li;
  }

  if (DATA && DATA.tree) {
    if (readerTree) buildTreeList(readerTree, true);
    if (preview) {
      buildTreeList(preview, false);
      // 列表真的溢出时才加底部渐隐，否则会遮住最后一条
      var markOverflow = function () {
        preview.classList.toggle("has-more", preview.scrollHeight - preview.clientHeight > 4);
      };
      markOverflow();
      window.addEventListener("resize", markOverflow, { passive: true });
    }
  } else if (preview) {
    preview.textContent = "";
    var li = el("li");
    var s = el("div", "state state--error");
    s.appendChild(svgSpan(ICON_BOOK));
    s.appendChild(el("b", null, "未能读取文档数据"));
    s.appendChild(el("p", null, "缺少 docs/doc-data.js。请运行 python tools/build_doc_data.py 重新生成后刷新页面。"));
    li.appendChild(s);
    preview.appendChild(li);
  }

  /* ------------------------------------------------- Markdown 渲染 */

  var FOOT_DEF = /^\[\^([^\]\s]+)\]:\s*([\s\S]*)$/;

  function splitCodeSpans(md) {
    var parts = [];
    var re = /(`{1,3}[^`]*`{1,3})/g;
    var last = 0, m;
    while ((m = re.exec(md)) !== null) {
      if (m.index > last) parts.push({ code: false, text: md.slice(last, m.index) });
      parts.push({ code: true, text: m[0] });
      last = m.index + m[0].length;
    }
    if (last < md.length) parts.push({ code: false, text: md.slice(last) });
    return parts;
  }

  function preprocess(md) {
    var defs = [];
    var kept = [];
    var current = null;

    md.split(/\r?\n/).forEach(function (line) {
      var m = line.match(FOOT_DEF);
      if (m) {
        current = { id: m[1], text: m[2].trim() };
        defs.push(current);
        return;
      }
      if (current && /^\s{2,}\S/.test(line)) {
        current.text += "\n" + line.trim();
        return;
      }
      current = null;
      kept.push(line);
    });

    var body = kept.join("\n");

    // 只在非代码片段里替换脚注引用
    body = splitCodeSpans(body).map(function (p) {
      if (p.code) return p.text;
      return p.text.replace(/\[\^([^\]\s]+)\]/g, function (full, id) {
        var i = defs.findIndex(function (d) { return d.id === id; });
        if (i === -1) return full;
        var n = i + 1;
        return '<sup class="fn"><a href="#fn-' + esc(id) + '" id="fnref-' + esc(id) + '">' + n + "</a></sup>";
      });
    }).join("");

    return { md: body, defs: defs };
  }

  function footnotesHtml(defs) {
    if (!defs.length) return "";
    var items = defs.map(function (d) {
      var body = window.marked ? window.marked.parseInline(d.text) : esc(d.text);
      return '<li id="fn-' + esc(d.id) + '">' + body +
        ' <a class="back" href="#fnref-' + esc(d.id) + '" aria-label="返回正文">&#8617;</a></li>';
    }).join("");
    return '<section class="footnotes"><h2>脚注 · Footnotes</h2><ol>' + items + "</ol></section>";
  }

  function postProcess(container, docPath) {
    var dir = dirOf(docPath);

    container.querySelectorAll("img").forEach(function (img) {
      var raw = img.getAttribute("src") || "";
      if (/^(https?:|data:|\/\/|\/)/i.test(raw)) return;
      img.setAttribute("src", resolveRel(DOC_ROOT + dir, raw));
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      if (!img.getAttribute("alt")) img.setAttribute("alt", "");
    });

    container.querySelectorAll("a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        return;
      }
      if (/^#/i.test(href)) return;
      if (/\.md(#.*)?$/i.test(href)) {
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          go(resolveRel(dir, href.split("#")[0]));
        });
      }
    });
  }

  /* --------------------------------------------------------- 状态 */
  function showLoading() {
    readerArticle.innerHTML =
      '<div class="skeleton"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
    if (readerFoot) readerFoot.hidden = true;
  }

  function showEmpty(rec) {
    readerArticle.innerHTML =
      '<div class="state">' + ICON_BOOK +
      "<b>" + esc(rec.title) + " · 尚未撰写</b>" +
      "<p>该文档已在目录中占位，正文还未整理完成。你可以先看其他已上线的条目，或到文档仓库提交补充。</p>" +
      '<p><a href="' + esc((DATA.meta && DATA.meta.repoUrl) || "#") +
      '" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">前往文档仓库</a></p>' +
      "</div>";
    if (readerFoot) readerFoot.hidden = true;
  }

  function showError(msg) {
    readerArticle.innerHTML =
      '<div class="state state--error">' + ICON_BOOK +
      "<b>文档渲染失败</b><p>" + esc(msg) + "</p></div>";
    if (readerFoot) readerFoot.hidden = true;
  }

  /* ------------------------------------------------------ 加载文档 */
  var currentPath = null;

  function findInTree(path, nodes) {
    var found = null;
    (nodes || []).forEach(function (n) {
      if (found) return;
      if (n.path === path) { found = n; return; }
      if (n.children) found = findInTree(path, n.children);
    });
    return found;
  }

  function loadDoc(path) {
    if (!DATA || !DATA.pages) { showError("缺少内置文档数据。"); return; }

    var rec = byPath[path] || { path: path, title: path, exists: false, group: "" };
    currentPath = path;

    linkRefs.forEach(function (n) {
      n.setAttribute("aria-current", n.getAttribute("data-path") === path ? "true" : "false");
    });
    if (readerPath) readerPath.textContent = path;

    var page = DATA.pages[path];

    if (!page) {
      if (rec && !rec.exists) showEmpty(rec);
      else showError("未在文档数据中找到 " + path + "。");
      return;
    }

    if (!window.marked) { showError("Markdown 解析器未加载（vendor/marked.min.js）。"); return; }

    showLoading();

    // 让骨架屏有一帧渲染时间，避免同步解析造成的白屏跳变
    window.requestAnimationFrame(function () {
      try {
        var pre = preprocess(page.markdown);
        var html = window.marked.parse(pre.md, { gfm: true, breaks: false });
        // 面包屑：分组各级与页面标题统一用同一个 chevron 图标分隔（原先分组之间用
        // 字面量 "›"、分组与标题之间用 SVG，视觉上不统一）。同时用 aria-label
        // 给出带分隔符的纯文本路径，避免读屏把各级标题连读成一个词。
        var crumbSep = svgSpan(ICON_CHEV).outerHTML;
        var trail = (rec.group ? rec.group.split(" / ") : []).concat([page.title]);
        var crumbs = rec.group
          ? '<p class="reader__crumbs" aria-label="' + esc(trail.join(" › ")) + '">' +
            trail.map(function (t) { return esc(t); }).join(crumbSep) + "</p>"
          : "";
        readerArticle.innerHTML =
          crumbs + '<div class="prose">' + html + footnotesHtml(pre.defs) + "</div>";

        postProcess(readerArticle, path);
        bindFootnoteBack(readerArticle);

        if (readerFoot) {
          var repo = (DATA.meta && DATA.meta.repoUrl) || "";
          readerFoot.hidden = false;
          readerFoot.innerHTML =
            '<span>' + esc(page.title) + " · " + page.bytes + " B</span>" +
            '<span>' +
            '<a href="' + DOC_ROOT + esc(path.split("/").map(encodeURIComponent).join("/")) +
            '" target="_blank" rel="noopener noreferrer">原始 Markdown</a>' +
            (repo ? ' &nbsp; <a href="' + esc(repo) + '" target="_blank" rel="noopener noreferrer">仓库</a>' : "") +
            "</span>";
        }

        if (readerMain) readerMain.scrollTop = 0;
        paintReaderProgress();
      } catch (err) {
        showError(String((err && err.message) || err));
      }
    });
  }

  function bindFootnoteBack(container) {
    container.querySelectorAll(".footnotes .back").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.getElementById(a.getAttribute("href").slice(1));
        if (target && target.scrollIntoView) target.scrollIntoView({ block: "center", behavior: reduce.matches ? "auto" : "smooth" });
      });
    });
  }

  /* --------------------------------------------------------- 路由 */
  var isOpen = false;

  function parseHash() {
    var h = decodeURIComponent(String(location.hash || "").replace(/^#/, ""));
    if (h === "doc") return { open: true, path: "" };
    if (h.indexOf("doc/") === 0) return { open: true, path: h.slice(4) };
    return { open: false, path: "" };
  }

  function go(path) {
    var next = path ? "#doc/" + path : "#doc";
    if (location.hash === next) {
      if (path && path !== currentPath) loadDoc(path);
      else openReader(path);
      return;
    }
    location.hash = next;
  }

  /* ----------------------------------------------------- 开关阅读器 */
  var lastFocus = null;

  function openReader(path) {
    var target = path || currentPath || (firstReady && firstReady.path) || null;
    if (target && target !== currentPath) {
      // 先给出骨架，避免开屏瞬间闪现上一次的正文
      loadDoc(target);
    } else if (!currentPath) {
      if (firstReady) loadDoc(firstReady.path);
      else showError("文档仓库中暂无已完成的条目。");
    }

    if (!isOpen) lastFocus = document.activeElement;
    isOpen = true;
    reader.setAttribute("data-open", "true");
    document.body.style.overflow = "hidden";
    if (readerClose) readerClose.focus();
  }

  function closeReader() {
    isOpen = false;
    reader.setAttribute("data-open", "false");
    readerBody.setAttribute("data-nav", "closed");
    if (readerNavToggle) readerNavToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onHashChange() {
    var r = parseHash();
    if (r.open) {
      openReader(r.path || null);
    } else if (isOpen) {
      closeReader();
    }
  }

  window.addEventListener("hashchange", onHashChange);

  document.querySelectorAll("[data-open-reader]").forEach(function (b) {
    b.addEventListener("click", function () {
      go(b.getAttribute("data-doc") || "");
    });
  });

  if (readerClose) {
    readerClose.addEventListener("click", function () {
      var was = location.hash;
      if (/^#doc/.test(was)) {
        // 回到文档章节，而不是页面顶部
        location.hash = "docs";
      } else {
        closeReader();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      if (readerBody.getAttribute("data-nav") === "open" && window.innerWidth < 900) {
        setNav(false);
        return;
      }
      if (/^#doc/.test(location.hash)) location.hash = "docs";
      else closeReader();
      return;
    }

    if (e.key !== "Tab") return;
    var focusables = reader.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    var list = Array.prototype.filter.call(focusables, function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* --------------------------------------------------- 侧栏抽屉 */
  function setNav(open) {
    readerBody.setAttribute("data-nav", open ? "open" : "closed");
    if (readerNavToggle) readerNavToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (readerNavToggle) {
    readerNavToggle.addEventListener("click", function () {
      setNav(readerBody.getAttribute("data-nav") !== "open");
    });
  }
  if (readerScrim) readerScrim.addEventListener("click", function () { setNav(false); });

  /* --------------------------------------------------- 阅读进度 */
  function paintReaderProgress() {
    if (!readerMain || !readerProgress) return;
    var h = readerMain.scrollHeight - readerMain.clientHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, readerMain.scrollTop / h)) : 0;
    readerProgress.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  if (readerMain) readerMain.addEventListener("scroll", paintReaderProgress, { passive: true });

  /* ------------------------------------------------------- 初始化 */
  if (DATA && DATA.meta && !DATA.pages) {
    showError("文档数据格式不正确。");
  }
  onHashChange();
})();
