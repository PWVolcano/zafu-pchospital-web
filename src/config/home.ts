/**
 * 首页内容数据
 *
 * 首页各区块的文案与条目集中在这里，组件只负责渲染。
 * 后续其他成员扩充服务项 / 流程步骤时，改这个文件即可。
 */

export type Service = {
  name: string;
  description: string;
  /** 文档仓库中是否已有对应文档：true 显示「已上线」，false 显示「撰写中」 */
  documented: boolean;
  /** documented 为 true 时，右侧标签的具体文案 */
  readyLabel?: string;
};

export type Principle = { title: string; description: string };
export type ProcessStep = { title: string; description: string };

export const heroContent = {
  tag: "志愿技术服务 · 面向全校师生",
  titleMain: "电脑医院",
  titleSub: "浙江农林大学",
  wordmark: "ZAFU PC HOSPITAL",
  meta: "电脑医院 · 志愿技术服务 · 浙江农林大学",
  glyph: "PC HOSPITAL",
  lead: "面向全校师生的志愿性计算机技术服务。拆机清灰、系统与驱动、校园网认证、蓝屏与磁盘排查，能处理的当场处理，处理不了的当面说明白。",
} as const;

export const aboutContent = {
  title: "一间由学生值守的电脑诊室",
  lead: "电脑医院是浙江农林大学的志愿性学生技术社团。我们做的事很具体：把出问题的电脑修好，把说不清的网络问题查清，再把攒下来的经验整理成任何人都能查的文档。",
  muted:
    "第一次来不需要准备什么。把设备带上，把问题的现象尽量说清楚就够了。我们会先尝试复现问题，再决定怎么动手。",
} as const;

export const tickerItems: readonly string[] = [
  "ZAFU PC HOSPITAL",
  "志愿技术服务",
  "CAMPUS NETWORK",
  "校园网认证",
  "HARDWARE",
  "拆机 · 清灰 · 硅脂",
  "SYSTEM & DRIVER",
  "系统与驱动",
  "DOCUMENTED",
  "全程留档",
];

export const principles: readonly Principle[] = [
  {
    title: "志愿性质，不收费",
    description:
      "社团由学生志愿运营。遇到超出我们能力范围的操作，会直接说明并放弃，不会硬着头皮往下拆。",
  },
  {
    title: "先确认，再动手",
    description:
      "涉及可能影响保修的操作（例如更换硅脂），会先向你确认保修信息。存在风险的操作，先说明清楚并征得同意。",
  },
  {
    title: "一人一机，全程留档",
    description:
      "每台机器由一人负责到底，非紧急情况不中途转交，避免漏掉螺丝、排线或无线网卡。处理完填写维修记录表。",
  },
];

export const services: readonly Service[] = [
  {
    name: "校园网认证与网络排障",
    description:
      "认证失败、认证后无法正常上网、路由器接入、多设备下线与 MAC Auth 配置。相关指引已整理成文，可直接查阅。",
    documented: true,
    readyLabel: "文档已上线",
  },
  {
    name: "硬件维修与保养",
    description:
      "拆机清灰、更换硅脂、风扇与排线复装、无线网卡与内存硬盘的安装检查。操作全程遵循《电医维修守则》。",
    documented: true,
    readyLabel: "手册已上线",
  },
  {
    name: "系统与软件安装",
    description: "系统重装、常用软件部署、开发与学习环境的依赖配置。",
    documented: false,
  },
  {
    name: "蓝屏与驱动排查",
    description: "蓝屏现象定位、驱动冲突与版本回退、外设兼容性问题排查。",
    documented: false,
  },
  {
    name: "磁盘与数据问题",
    description: "分区与扩容、硬盘健康检测、异常掉盘判断与数据先行的处理顺序。",
    documented: false,
  },
  {
    name: "计算机基础答疑",
    description: "从最基础的使用与维护问题讲起，包括日常保养、备份习惯和安全安装软件。",
    documented: false,
  },
];

export const processSteps: readonly ProcessStep[] = [
  {
    title: "说明现象",
    description: "什么时候开始、什么操作之后出现、重启后是否复现。这些信息比一句「坏了」有用得多。",
  },
  {
    title: "现场复现",
    description: "我们会先尝试复现问题，再据此判断原因。描述会听，但不会只凭描述下结论。",
  },
  {
    title: "确认风险",
    description:
      "涉及保修信息或存在风险的操作，我们会先向你说明可能的后果，在你表示同意之后才开始。",
  },
  {
    title: "动手处理",
    description: "一人一机，非紧急情况不中途转交他人。拆下的螺丝位置、排线和无线网卡都会记录清楚。",
  },
  {
    title: "记录归档",
    description: "填写维修记录表并留下联系方式。如果之后我们自己发现了新问题，能第一时间通知到你。",
  },
];

export const processNotice = {
  badge: "客户须知",
  title: "我们是志愿性质的社团",
  paragraphs: [
    "遇到困难时我们会放弃。因此，维修之后如果出现任何损失，我们不承担相应责任。",
    "对于存在风险的操作，我们会在动手前明确告知，并在你表示同意后再进行。",
  ],
} as const;

export const docsTeaser = {
  title: "全套维修与排障文档，开源可查",
  lead: "文档仓库 ZAFU-PCHospital-Doc 收录了校园网认证、硬件保养、系统与驱动等条目，源文件全部公开。可以按目录直接查阅，也欢迎提交勘误与补充。",
} as const;
