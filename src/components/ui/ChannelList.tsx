import { Icon } from "@/components/ui/Icon";
import type { LinkItem } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * ChannelList —— 渠道 / 入口列表
 *
 * 对应设计基准的 `.channels` / `.channel`：
 * 左侧等宽分类标签、中间标题与说明、右侧图标。
 * 有 href 时整行是外链并带位移反馈，无 href 时为静态条目。
 */

export type ChannelListProps = {
  items: readonly LinkItem[];
  className?: string;
};

export function ChannelList({ items, className }: ChannelListProps) {
  return (
    <ul className={cn("channels", className)}>
      {items.map((item) => (
        <li key={item.title}>
          {item.href ? (
            <a className="channel" href={item.href} target="_blank" rel="noopener noreferrer">
              <span className="channel__kind">{item.kind}</span>
              <span className="channel__body">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <Icon name="arrowUpRight" />
            </a>
          ) : (
            <div className="channel channel--static">
              <span className="channel__kind">{item.kind}</span>
              <span className="channel__body">
                <strong>
                  {item.title}
                  {item.pending ? <span className="todo">待补充</span> : null}
                </strong>
                <span>{item.description}</span>
              </span>
              <Icon name="fileText" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
