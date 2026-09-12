"use client";

import { useEffect } from "react";

/**
 * SiteEffects —— 站点级视觉行为
 *
 * 集中实现设计基准中三处与滚动/指针相关的效果，全站只挂载一次：
 *
 * 1. 进场揭示：观察 `.reveal`，进入视口后加 `.is-in`，只播一次。
 * 2. 顶部进度线：优先由 CSS 滚动时间轴驱动（见 globals.css 的 @supports 分支），
 *    浏览器不支持 `animation-timeline` 时才用 JS 兜底。
 * 3. 指针准星：仅在「支持悬停的精确指针 + 未开启减少动效」时启用。
 *
 * 原则：只动 transform / opacity，不读布局属性，不用滚动监听做动画。
 *
 * 注意：`html.js` 这个类由 app/layout.tsx 中的内联脚本在 hydration 之前加上
 * （用于避免进场元素闪烁），本组件不重复添加，保持单一来源。
 */

export function SiteEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    /* ------------------------------------------------------- 进场揭示 */
    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    let revealObserver: IntersectionObserver | null = null;

    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target); // 只播一次，播完即注销
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
      );
      reveals.forEach((el) => revealObserver?.observe(el));
    }

    /* --------------------------------------------------- 顶部进度线 */
    const supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: scroll()");

    let onScroll: (() => void) | null = null;

    if (!supportsScrollTimeline) {
      const bar = document.getElementById("scrollBar");
      let ticking = false;

      const paint = () => {
        ticking = false;
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
        if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
      };

      onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(paint);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      paint();
    }

    /* ----------------------------------------------------- 指针准星 */
    const reticle = document.getElementById("reticle");
    let cursorAnimation: number | null = null;
    let onPointerMove: ((event: PointerEvent) => void) | null = null;
    let onPointerLeave: (() => void) | null = null;
    let onReduceChange: (() => void) | null = null;

    if (reticle && !reduce.matches && fine.matches) {
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let currentX = targetX;
      let currentY = targetY;
      let shown = false;

      const loop = () => {
        currentX += (targetX - currentX) * 0.22;
        currentY += (targetY - currentY) * 0.22;
        reticle.style.transform = `translate3d(${currentX.toFixed(2)}px,${currentY.toFixed(2)}px,0) translate(-50%,-50%)`;

        if (Math.abs(targetX - currentX) > 0.2 || Math.abs(targetY - currentY) > 0.2) {
          cursorAnimation = window.requestAnimationFrame(loop);
        } else {
          cursorAnimation = null;
        }
      };

      onPointerMove = (event) => {
        targetX = event.clientX;
        targetY = event.clientY;

        if (!shown) {
          shown = true;
          currentX = targetX;
          currentY = targetY;
          reticle.setAttribute("data-active", "true");
        }
        if (cursorAnimation === null) cursorAnimation = window.requestAnimationFrame(loop);
      };

      onPointerLeave = () => {
        shown = false;
        reticle.setAttribute("data-active", "false");
      };

      onReduceChange = () => reticle.setAttribute("data-active", "false");

      document.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
      reduce.addEventListener("change", onReduceChange);
    }

    return () => {
      revealObserver?.disconnect();

      if (onScroll) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }

      if (onPointerMove) document.removeEventListener("pointermove", onPointerMove);
      if (onPointerLeave) document.removeEventListener("pointerleave", onPointerLeave);
      if (onReduceChange) reduce.removeEventListener("change", onReduceChange);
      if (cursorAnimation !== null) window.cancelAnimationFrame(cursorAnimation);
    };
  }, []);

  return (
    <>
      {/* 阅读进度线：条本身由 CSS 滚动时间轴或上面的兜底逻辑驱动 */}
      <div className="progress-line" aria-hidden="true">
        <i className="progress-line__bar" id="scrollBar" />
      </div>

      {/* 指针准星：桌面精确指针下跟随鼠标，其余环境保持隐藏 */}
      <div className="reticle" id="reticle" data-active="false" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
        >
          <line x1="12" y1="2" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="2" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="22" y2="12" />
        </svg>
        <span className="reticle__dot" />
      </div>
    </>
  );
}
