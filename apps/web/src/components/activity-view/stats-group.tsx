import type { ReactNode } from "react";

type StatGroupItem = {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
};

function StatGroup({ items }: { items: StatGroupItem[] }) {
  return (
    <div className="divide-border grid grid-cols-3 divide-x">
      {items.map((item) => (
        <div key={item.label} className="px-5 py-4 first:pl-0 last:pr-0">
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">
            {item.label}
          </p>
          <p className="text-2xl leading-none font-bold">{item.value}</p>
          {item.sub && (
            <p className="text-muted-foreground mt-1 text-xs">{item.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export { StatGroup };
