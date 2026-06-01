import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function AIInsightBox({ title = "AI Insight", children, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ai/20 bg-ai-soft/60 p-4 ai-gradient",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-ai text-ai-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="text-sm font-semibold text-ai">{title}</span>
      </div>
      <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
    </div>
  );
}
