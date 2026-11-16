import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Card({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section className={`glass animate-rise min-w-0 rounded-3xl p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </section>
  );
}

export function CardTitle({ icon, children, right }: { icon?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        {icon && <span className="text-xl">{icon}</span>}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function StatBar({
  icon,
  label,
  value,
  max = 100,
  from,
  to,
}: {
  icon: string;
  label: string;
  value: number;
  max?: number;
  from: string;
  to: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-bold text-white/85">
          <span>{icon}</span>
          {label}
        </span>
        <span className="font-display font-semibold tabular-nums">
          {Math.round(value)}
          <span className="text-white/40">/{max}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="relative h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${from}, ${to})`, boxShadow: `0 0 12px ${to}88` }}
        >
          <div className="shine absolute inset-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  wide = false,
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  dismissable?: boolean;
}) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissable]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={dismissable ? onClose : undefined}
    >
      <div
        className={`glass-strong animate-pop max-h-[92vh] w-full overflow-y-auto rounded-3xl p-5 shadow-2xl scroll-thin sm:p-7 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function EnergyCost({ cost }: { cost: number }) {
  return <span className="chip bg-amber-300/15 text-amber-200">⚡ {cost}</span>;
}
