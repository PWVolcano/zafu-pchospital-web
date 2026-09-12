import { Reveal } from "@/components/ui/Reveal";
import type { Service } from "@/config/home";
import { cn, pad2 } from "@/lib/utils";

/**
 * ServiceList —— 服务条目列表
 *
 * 对应设计基准的 `.svc-list` / `.svc`。首页「服务」区块与 /about 页的
 * 「服务范围」共用同一实现。
 */

export type ServiceListProps = {
  items: readonly Service[];
  className?: string;
};

export function ServiceList({ items, className }: ServiceListProps) {
  return (
    <ol className={cn("svc-list", className)}>
      {items.map((service, index) => (
        <Reveal as="li" className="svc" index={index} key={service.name}>
          <span className="svc__idx">{pad2(index + 1)}</span>
          <h3 className="svc__name">{service.name}</h3>
          <span className={cn("svc__tag", service.documented && "is-ready")}>
            <i aria-hidden="true" />
            {service.documented ? (service.readyLabel ?? "文档已上线") : "文档撰写中"}
          </span>
          <p className="svc__desc">{service.description}</p>
        </Reveal>
      ))}
    </ol>
  );
}
