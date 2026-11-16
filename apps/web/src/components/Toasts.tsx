import { useStore } from '../state/store';

const TONES = {
  good: 'from-emerald-400/25 to-emerald-400/5 border-emerald-300/30',
  bad: 'from-rose-500/25 to-rose-500/5 border-rose-300/30',
  epic: 'from-fuchsia-500/35 to-violet-500/10 border-fuchsia-300/40',
  neutral: 'from-white/15 to-white/5 border-white/15',
};

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`glass-strong animate-bounce-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-gradient-to-r p-3 text-left shadow-xl ${TONES[t.tone ?? 'neutral']}`}
        >
          <span className="text-2xl">{t.icon}</span>
          <span className="min-w-0">
            <span className="block font-display font-semibold leading-tight">{t.title}</span>
            {t.text && <span className="block text-sm text-white/70">{t.text}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
