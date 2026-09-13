/**
 * 站点级配置
 *
 * 全站共用的站点信息、外链与联系方式。组件中禁止硬编码这些内容，
 * 需要新增时先在这里补充字段，再在组件里引用。
 */

export type LinkItem = {
  /** 分类标签，显示为左侧的等宽英文/中文小标签 */
  kind: string;
  title: string;
  description: string;
  /** 有 href 时为可点击外链，无 href 时为静态展示条目 */
  href?: string;
  /** 内容待社团确认，界面会显示「待补充」标记 */
  pending?: boolean;
};

export const siteConfig = {
  name: "浙江农林大学电脑医院",
  shortName: "电脑医院",
  nameEn: "ZAFU PC HOSPITAL",
  tagline: "志愿技术服务 · 面向全校师生",

  description:
    "浙江农林大学电脑医院的社团综合服务平台。志愿性计算机技术服务：电脑散热模组深度清理、硬件故障排查、系统与软件问题处理、网络问题排查、计算机基础答疑。",

  /** 正式域名待绑定后替换 */
  url: "https://github.com/ZAFU-PCHospital",

  /** GitHub 组织 */
  githubOrg: "https://github.com/ZAFU-PCHospital",

  /** 技术文档仓库（mdBook 源文件） */
  docRepo: {
    name: "ZAFU-PCHospital-Doc",
    url: "https://github.com/ZAFU-PCHospital/ZAFU-PCHospital-Doc",
    author: "RepentStar",
    /** 目录条目外链使用的分支名，仓库改名或改用其他默认分支时改这里 */
    branch: "main",
  },

  /**
   * 技术文档站正式域名。
   * 目前 mdBook 项目托管在 GitHub，尚未绑定独立域名；
   * 部署后设置环境变量 NEXT_PUBLIC_DOCS_URL 即可让 /docs 页优先跳转正式站点。
   */
  docsSiteUrl: process.env.NEXT_PUBLIC_DOCS_URL ?? "",

  /** 校园网相关常用入口 */
  campusLinks: {
    auth: "http://10.152.250.2/",
    selfService: "https://zfw.zafu.edu.cn/home",
  },
} as const;

/** 求助渠道（静态展示） */
export const contactChannels: readonly LinkItem[] = [
  {
    kind: "活动",
    title: "线下问诊活动",
    description: "具体时间地点不定期公布，请留意群内通知",
  },
  {
    kind: "线上",
    title: "QQ 群",
    description: "532502904 · 报名、咨询与活动通知都在群里",
  },
];

/** 求助渠道二维码（与 contactChannels 的 QQ 群对应） */
export const contactQr = {
  src: "/qq-group-qrcode-accent.png",
  alt: "浙江农林大学电脑医院 QQ 群二维码，群号 532502904",
  caption: "扫码加入 QQ 群",
  hint: "群号 532502904",
} as const;

/** 常用入口（外链） */
export const quickLinks: readonly LinkItem[] = [
  {
    kind: "校园网",
    title: "认证登录入口",
    description: "10.152.250.2 · 校内网络环境访问，注意选择正确的服务商",
    href: "http://10.152.250.2/",
  },
  {
    kind: "自助",
    title: "校园网自助服务",
    description: "自助下线设备、配置 MAC Auth、查看在线终端",
    href: "https://zfw.zafu.edu.cn/home",
  },
  {
    kind: "文档",
    title: "ZAFU-PCHospital-Doc",
    description: "文档源文件仓库，欢迎提交勘误与补充",
    href: "https://github.com/ZAFU-PCHospital/ZAFU-PCHospital-Doc",
  },
];

/** 页脚免责说明 */
export const footerNote =
  "本站为社团官方站点，页面中涉及的文档目录与正文均来自公开文档仓库 " +
  "ZAFU-PCHospital-Doc（作者 RepentStar，由 mdBook 构建）。";
