/**
 * 站点导航配置
 *
 * 第一阶段的公开页面只有四个。Header（桌面左侧索引栏 / 移动端索引浮层）
 * 全部从这里读取，新增页面时只改这里。
 */

export type NavItem = {
  /** 章节编号，用于索引栏与浮层的 "01 / 02" 标记 */
  index: string;
  /** 完整名称，用于移动端索引浮层 */
  label: string;
  /** 短名称，用于桌面索引栏的竖排文字（两字最佳） */
  shortLabel: string;
  /** 英文标签，用于索引栏辅助说明 */
  labelEn: string;
  href: string;
};

export const mainNav: readonly NavItem[] = [
  { index: "01", label: "首页", shortLabel: "首页", labelEn: "Home", href: "/" },
  { index: "02", label: "关于我们", shortLabel: "关于", labelEn: "About", href: "/about" },
  { index: "03", label: "加入我们", shortLabel: "加入", labelEn: "Join", href: "/join" },
  { index: "04", label: "技术文档", shortLabel: "文档", labelEn: "Docs", href: "/docs" },
] as const;
