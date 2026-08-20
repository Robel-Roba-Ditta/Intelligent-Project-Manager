import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

const COLUMNS = ['To do', 'In progress', 'Done'];

function MiniBoard() {
  return (
    <div className="relative h-[150px] w-[342px]" aria-hidden="true">
      {COLUMNS.map((label, i) => (
        <div
          key={label}
          className="absolute top-0 h-full w-[90px] rounded-lg bg-ink-soft/60"
          style={{ left: i * 114 }}
        >
          <p className="px-2 pt-2 font-mono text-[9px] tracking-widest text-muted-dark uppercase">
            {label}
          </p>
        </div>
      ))}

      {}
      <div
        className="absolute h-8 w-[78px] rounded-md border-l-2 border-muted-dark bg-ink-softer"
        style={{ left: 6, top: 34 }}
      />
      <div
        className="absolute h-8 w-[78px] rounded-md border-l-2 border-muted-dark bg-ink-softer"
        style={{ left: 6, top: 76 }}
      />
      <div
        className="absolute h-8 w-[78px] rounded-md border-l-2 border-accent-done bg-ink-softer"
        style={{ left: 120, top: 34 }}
      />

      {}
      <div
        className="card-travel absolute flex h-8 w-[78px] items-center justify-between rounded-md border-l-2 bg-ink-softer px-2"
        style={{ left: 120, top: 34 }}
      >
        <span className="h-1.5 w-8 rounded-full bg-muted-dark/40" />
        <span className="card-travel-check flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent-done">
          <Check size={9} strokeWidth={3} className="text-ink" />
        </span>
      </div>
    </div>
  );
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {}
      <div className="hidden flex-col justify-between bg-ink px-14 py-12 lg:flex">
        <div className="flex items-center gap-2">
          <img
            src="/IPM-Logo.png"
            alt="IPM logo"
            className="h-8 w-8 rounded object-cover"
          />
          <span className="font-display text-lg font-semibold text-paper">IPM</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <p className="font-mono text-xs tracking-widest text-accent-progress uppercase">
              {eyebrow}
            </p>
            <h1 className="max-w-sm font-display text-3xl leading-tight font-semibold text-paper">
              {title}
            </h1>
            <p className="max-w-sm text-sm text-muted-dark">{subtitle}</p>
          </div>
          <MiniBoard />
        </div>

        <p className="font-mono text-xs text-muted-dark">Sprint 4 · 12 tasks tracked</p>
      </div>

      {}
      <div className="flex flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <img
            src="/IPM-Logo.png"
            alt="IPM logo"
            className="h-8 w-8 rounded object-cover"
          />
          <span className="font-display text-lg font-semibold text-ink">IPM</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
