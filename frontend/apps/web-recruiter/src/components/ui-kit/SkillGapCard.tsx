import { Check, X, Plus } from "lucide-react";

interface Props {
  matched: string[];
  missing: string[];
  suggested?: string[];
}

export function SkillGapCard({ matched, missing, suggested = [] }: Props) {
  return (
    <div className="card-surface p-5 space-y-4">
      <h3 className="font-semibold text-sm">Phân tích kỹ năng</h3>
      <div>
        <div className="text-xs text-muted-foreground mb-2">Kỹ năng phù hợp ({matched.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {matched.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success-soft px-2 py-0.5 text-xs text-success">
              <Check className="size-3" /> {s}
            </span>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-2">Kỹ năng còn thiếu ({missing.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {missing.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md border border-danger/20 bg-danger-soft px-2 py-0.5 text-xs text-danger">
              <X className="size-3" /> {s}
            </span>
          ))}
        </div>
      </div>
      {suggested.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">Đề xuất bổ sung</div>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-md border border-ai/20 bg-ai-soft px-2 py-0.5 text-xs text-ai">
                <Plus className="size-3" /> {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
