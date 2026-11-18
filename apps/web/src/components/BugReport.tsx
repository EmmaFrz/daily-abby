import { useEffect, useRef, useState, type FormEvent } from 'react';
import { sfx } from '../lib/sound';
import { useStore } from '../state/store';

const MAX = 1000;
const COOLDOWN_MS = 60_000;

type Status = 'idle' | 'sending' | 'error';

/**
 * Botón discreto en la esquina inferior izquierda para reportar bugs.
 * Abre un formulario mínimo que se envía a /api/report-bug, y la función
 * del servidor lo reenvía al canal de Discord.
 */
export function BugReport() {
  const { toast } = useStore();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const lastSent = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const toggle = () => {
    sfx('pop');
    setOpen((o) => !o);
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = description.trim();
    if (text.length < 5) {
      setError('Cuéntanos un poco más del problema.');
      return;
    }
    if (Date.now() - lastSent.current < COOLDOWN_MS) {
      setError('Espera un minuto antes de enviar otro reporte.');
      return;
    }

    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/report-bug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          description: text,
          contact: contact.trim(),
          website,
          page: location.hash || '#diarios',
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}×${window.innerHeight}`,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'No se pudo enviar el reporte.');
      }
      lastSent.current = Date.now();
      setDescription('');
      setStatus('idle');
      setOpen(false);
      toast({ icon: '🐞', title: '¡Gracias por el reporte!', text: 'Lo revisaremos pronto.', tone: 'good' });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-3 z-[45] md:bottom-4 md:left-4"
    >
      {open && (
        <form
          onSubmit={submit}
          className="glass-strong animate-pop absolute bottom-full left-0 mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-sm font-bold">🐞 Reportar un bug</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="grid h-6 w-6 place-items-center rounded-full text-dim hover:bg-white/8 hover:text-white"
            >
              ✕
            </button>
          </div>

          <textarea
            autoFocus
            required
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX))}
            placeholder="¿Qué pasó? ¿En qué juego o sección?"
            rows={4}
            className="w-full resize-none rounded-xl border border-slot bg-paper p-2 text-sm text-white outline-none placeholder:text-dim focus:border-abby"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value.slice(0, 80))}
            placeholder="Tu usuario (opcional)"
            className="mt-1.5 w-full rounded-xl border border-slot bg-paper px-2 py-1.5 text-sm text-white outline-none placeholder:text-dim focus:border-abby"
          />
          {/* Honeypot anti-bots: invisible para personas. */}
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-dim">
              {description.length}/{MAX}
            </span>
            <button type="submit" disabled={status === 'sending'} className="btn btn-primary px-4 py-1.5 text-sm disabled:opacity-60">
              {status === 'sending' ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs font-semibold text-rose-200">{error}</p>}
        </form>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        title="¿Encontraste un error? Repórtalo"
        className="flex items-center gap-1.5 rounded-full border border-slot bg-paper/85 px-2.5 py-1 text-[11px] font-bold text-dim opacity-70 shadow-sm backdrop-blur transition hover:text-white hover:opacity-100 focus-visible:opacity-100"
      >
        <span aria-hidden>🐞</span>
        Reportar bug
      </button>
    </div>
  );
}
