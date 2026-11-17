import { useStore } from '../state/store';

const TONES = {
  good: 'border-l-ok',
  bad: 'border-l-rose-500',
  epic: 'border-l-gold',
  neutral: 'border-l-slot',
};

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`glass-strong animate-bounce-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border-l-[6px] p-3 text-left shadow-xl ${TONES[t.tone ?? 'neutral']}`}
        >
          <span className="text-2xl">{t.icon}</span>
          <span className="min-w-0">
            <span className="block font-display font-semibold leading-tight">{t.title}</span>
            {t.text && <span className="block text-sm text-dim">{t.text}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
