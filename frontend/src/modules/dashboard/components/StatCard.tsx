import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'brand' | 'done' | 'progress' | 'danger';
}) {
  const toneClasses: Record<string, string> = {
    brand: 'bg-brand-light text-brand-dark',
    done: 'bg-accent-done/10 text-accent-done-dim',
    progress: 'bg-accent-progress/10 text-accent-progress',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <div className="rounded-lg border border-border-app bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
