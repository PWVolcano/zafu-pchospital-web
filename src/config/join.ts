/**
 * /join 页面内容
 *
 * 加入我们。本阶段只提供「招新说明」性质的静态内容骨架，
 * 在线报名、成员系统等属于后续阶段（见需求分析文档第 4 章），
 * 因此页面上所有具体招新信息一律标注为待补充。
 */

export type JoinItem = { title: string; description: string };

export const joinPage = {
  title: "加入我们",
  lead: "电脑医院长期面向全校招收新成员。不要求你一开始就会修电脑，但要求你愿意把它学会，并且愿意对别人的设备负责。",
} as const;

export const joinSections = {
  expect: { index: "02", label: "Expect", title: "我们希望你具备" },
  flow: { index: "03", label: "Flow", title: "加入流程" },
  notice: { index: "04", label: "Notice", title: "加入须知" },
} as const;

export const joinExpectations: readonly JoinItem[] = [
  {
    title: "愿意投入时间",
    description:
      "值班、活动与培训都需要时间。具体的最低投入要求由社团在每学期招新时确认，本页暂不写死。",
  },
  {
    title: "不要求技术基础",
    description:
      "拆机、清灰、系统安装这些操作都会有人带。真正的要求是动手前先想清楚，拿不准就问，不要硬上。",
  },
  {
    title: "遵守《电医维修守则》",
    description:
      "一人一机、先确认再动手、维修后填记录表。守则既是给用户看的，也是成员每次动手前自己对的表。",
  },
  {
    title: "对用户的信息负责",
    description:
      "维修过程中会接触到用户的设备、数据与联系方式，仅用于完成本次维修，不得用于其他用途。",
  },
];

export const joinFlow: readonly JoinItem[] = [
  {
    title: "关注招新通知",
    description: "招新时间与报名方式由社团每学期另行发布，本页会在确认后同步。",
  },
  {
    title: "提交报名信息",
    description: "按要求填写基本信息与可投入的时间段。具体报名渠道待补充。",
  },
  {
    title: "面谈与了解",
    description: "简单聊一聊你的兴趣方向与时间安排，也让你了解社团实际在做什么。",
  },
  {
    title: "跟岗与培训",
    description: "跟着老成员看几次实际操作，熟悉流程与守则，再决定是否继续。",
  },
  {
    title: "成为正式成员",
    description: "通过后由管理员在后台完成成员登记，之后即可参与值班与活动。",
  },
];

export const joinNotice = {
  badge: "加入须知",
  title: "本页目前是内容骨架",
  paragraphs: [
    "在线报名、成员系统与权限管理属于后续开发阶段，本阶段不实现，因此本页只提供招新说明性质的静态内容。",
    "招新时间、报名方式、最低投入要求等具体信息，需社团确认后再补入本页，请不要以本页内容作为最终依据。",
  ],
} as const;

/** 需要社团确认后再补写的字段 */
export const joinPendingFields: readonly string[] = [
  "本学期招新时间窗口",
  "报名渠道与所需材料",
  "面试与跟岗的具体安排",
  "成员最低值班时长要求",
];
