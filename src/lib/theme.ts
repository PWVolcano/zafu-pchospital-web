/**
 * 主题的客户端运行时：持久化、DOM 应用、订阅、防闪烁引导脚本
 *
 * 与 `src/config/theme.ts` 的分工：
 * - `config/theme.ts` 回答「有哪些模式与主题、怎么映射」——纯数据，服务端可用。
 * - 本文件回答「怎么把模式落到 DOM 上、怎么记住、怎么让 React 知道」。
 *
 * 视觉的唯一入口是 `<html>` 上的两个属性：
 *
 *   data-mode    normal | dark       用户选的显示模式
 *   data-theme   swiss-cobalt | ...  解析出的具体主题，CSS 主题层按它取色
 *
 * 组件永远不读 data-mode 来决定颜色，颜色一律由 CSS 令牌自动决定。
 */

import {
  DEFAULT_THEME_MODE,
  FALLBACK_FOLLOWS_SYSTEM,
  isThemeMode,
  resolveTheme,
  siteThemeConfig,
  SYSTEM_DARK_MODE,
  type ThemeMode,
} from "@/config/theme";

/** localStorage 键名。改动即等于让所有访客回到默认模式。 */
export const THEME_STORAGE_KEY = "zafu-pchospital:theme-mode";

/** 读取本地保存的模式。无存储 / 隐私模式 / 值非法时返回 null。 */
export function readStoredThemeMode(): ThemeMode | null {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

function storeThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* 存储被禁用：本次会话仍然生效，只是刷新后不保留 —— 不视为错误 */
  }
}

/** 读取 `<html>` 上已生效的模式（由引导脚本写入），作为客户端快照来源。 */
function readAppliedThemeMode(): ThemeMode {
  if (typeof document === "undefined") return DEFAULT_THEME_MODE;
  const applied = document.documentElement.dataset.mode;
  return isThemeMode(applied) ? applied : DEFAULT_THEME_MODE;
}

/**
 * 把模式与解析出的主题写到 `<html>` 上。
 * 这是全站**唯一**改变主题视觉的入口；组件不要自己去动这些属性。
 */
export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return;

  const theme = resolveTheme(mode);
  const root = document.documentElement;

  root.dataset.mode = mode;
  root.dataset.theme = theme.id;

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.browserThemeColor);
}

/* ---------------------------------------------------------------- 订阅 */
/* 页面里可能同时存在多个切换入口（桌面索引栏 + 移动顶栏），
   它们必须同步显示当前状态，所以用一个极小的外部 store，
   而不是引入状态管理库或 React Context。 */

let snapshot: ThemeMode | null = null;
const listeners = new Set<() => void>();

/** 客户端快照。供 useSyncExternalStore 读取。 */
export function getThemeModeSnapshot(): ThemeMode {
  if (snapshot === null) snapshot = readAppliedThemeMode();
  return snapshot;
}

/**
 * 服务端快照。hydration 期间 React 用它与 SSR 输出对齐，
 * hydration 结束后才切到真实客户端快照 —— 因此不会产生 mismatch 警告。
 */
export function getServerThemeModeSnapshot(): ThemeMode {
  return DEFAULT_THEME_MODE;
}

export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 用户主动切换模式：写 DOM → 写存储 → 通知所有订阅者。 */
export function setThemeMode(mode: ThemeMode): void {
  snapshot = mode;
  applyThemeMode(mode);
  storeThemeMode(mode);
  for (const listener of listeners) listener();
}

/* ------------------------------------------------------------ 引导脚本 */

/**
 * 生成 hydration 之前执行的内联脚本。
 *
 * 它在页面首次绘制前就把 `data-mode` / `data-theme` 写到 `<html>` 上，
 * 因此刷新时不会出现「先正常模式、再突然变深色」的闪动；
 * 同时因为属性在 hydration 之前就已存在，React 也不会报 mismatch。
 *
 * 脚本内容由主题注册表生成，避免配色方案在多处重复维护。
 */
export function buildThemeBootstrapScript(): string {
  const map: Record<string, { theme: string; color: string }> = {};
  for (const mode of Object.keys(siteThemeConfig) as ThemeMode[]) {
    const theme = resolveTheme(mode);
    map[mode] = { theme: theme.id, color: theme.browserThemeColor };
  }

  return [
    "(function(){try{",
    `var K=${JSON.stringify(THEME_STORAGE_KEY)},`,
    `M=${JSON.stringify(map)},`,
    `D=${JSON.stringify(DEFAULT_THEME_MODE)},`,
    `S=${JSON.stringify(SYSTEM_DARK_MODE)},`,
    `F=${FALLBACK_FOLLOWS_SYSTEM ? "1" : "0"},`,
    "r=document.documentElement,s=null;",
    "try{s=window.localStorage.getItem(K)}catch(e){}",
    "var m;",
    "if(s&&Object.prototype.hasOwnProperty.call(M,s)){m=s}",
    "else if(F&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches){m=S}",
    "else{m=D}",
    "var t=M[m];",
    'r.setAttribute("data-mode",m);r.setAttribute("data-theme",t.theme);',
    'var q=document.querySelector(\'meta[name="theme-color"]\');',
    'if(q){q.setAttribute("content",t.color)}',
    "}catch(e){}})();",
  ].join("");
}
