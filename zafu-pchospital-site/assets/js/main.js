/* =========================================================================
   浙江农林大学电脑医院 · 静态展示页交互
   只动 transform / opacity；滚动监听全部走 IntersectionObserver
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var root = document.documentElement;

  /* ---------------------------------------------------------- 进场揭示 */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealIO = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        obs.unobserve(e.target);          // 只播一次，播完即注销
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

    reveals.forEach(function (el) { revealIO.observe(el); });
  }

  /* ------------------------------------------------------ 顶部进度线 */
  /* 现代浏览器由 CSS 滚动时间轴驱动（见 style.css 的 @supports 分支）；
     这里只在浏览器不支持 animation-timeline 时兜底。 */
  var hasScrollTimeline =
    window.CSS && window.CSS.supports && window.CSS.supports("animation-timeline: scroll()");

  if (!hasScrollTimeline) {
    var bar = document.getElementById("scrollBar");
    var ticking = false;

    var paintProgress = function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(paintProgress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    paintProgress();
  }

  /* ------------------------------------------------------- 索引高亮 */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
  var sections = spyLinks
    .map(function (a) { return document.getElementById(a.getAttribute("data-spy")); })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var visible = {};
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var best = null, bestRatio = 0;
      sections.forEach(function (s) {
        var r = visible[s.id] || 0;
        if (r > bestRatio) { bestRatio = r; best = s.id; }
      });
      if (!best) return;
      spyLinks.forEach(function (a) {
        a.setAttribute("aria-current", a.getAttribute("data-spy") === best ? "true" : "false");
      });
    }, { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });

    sections.forEach(function (s) { spyIO.observe(s); });
  }

  /* --------------------------------------------------------- 索引浮层 */
  var menu = document.getElementById("menu");
  var menuOpen = document.getElementById("menuOpen");
  var menuClose = document.getElementById("menuClose");

  function setMenu(open) {
    if (!menu) return;
    menu.setAttribute("data-open", open ? "true" : "false");
    if (menuOpen) menuOpen.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open && menuClose) menuClose.focus();
    else if (!open && menuOpen) menuOpen.focus();
  }

  if (menuOpen) menuOpen.addEventListener("click", function () { setMenu(true); });
  if (menuClose) menuClose.addEventListener("click", function () { setMenu(false); });
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && menu.getAttribute("data-open") === "true") setMenu(false);
  });

  /* ----------------------------------------------------------- 准星 */
  var reticle = document.getElementById("reticle");
  if (reticle && !reduce.matches && fine.matches) {
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var cx = tx, cy = ty, raf = null, shown = false;

    function loop() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      reticle.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0) translate(-50%,-50%)";
      if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) {
        shown = true;
        cx = tx; cy = ty;
        reticle.setAttribute("data-active", "true");
        if (raf === null) raf = window.requestAnimationFrame(loop);
      }
      if (raf === null) raf = window.requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerdown", function () { reticle.dataset.press = "true"; });
    document.addEventListener("pointerup", function () { delete reticle.dataset.press; });
    document.addEventListener("pointerleave", function () {
      shown = false;
      reticle.setAttribute("data-active", "false");
    });
    reduce.addEventListener("change", function () {
      reticle.setAttribute("data-active", "false");
    });
  }

  /* ------------------------------------------- 用文档仓库数据填读数 */
  var data = window.ZAFU_DOC_DATA;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  if (data && data.meta) {
    var counts = data.meta.counts || {};
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var key = el.getAttribute("data-count");
      if (key === "generated") {
        el.textContent = String(data.meta.generatedAt || "").replace("T", " ").replace(/\+08:00$/, "");
        return;
      }
      if (typeof counts[key] === "number") el.textContent = pad2(counts[key]);
    });

    document.querySelectorAll("[data-doc-source]").forEach(function (el) {
      el.textContent = (data.meta.authors && data.meta.authors[0]) ? data.meta.authors[0] : "来源仓库";
    });
    document.title = "浙江农林大学电脑医院 · 社团综合服务平台";
  }

  var year = document.getElementById("footerYear");
  if (year) year.textContent = String(new Date().getFullYear());
})();
