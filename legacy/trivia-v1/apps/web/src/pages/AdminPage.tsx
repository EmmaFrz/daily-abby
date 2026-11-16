/** Placeholder: el panel de administración llega en la fase 2 (Supabase). */
export default function AdminPage() {
  const planned = [
    'Preguntas: crear, editar, activar/desactivar, categorías, dificultad, tiempo, imagen',
    'Episodios: armar el programa de cada noche eligiendo y ordenando preguntas',
    'Apariencia: colores, logo, textos, música y parámetros de la escena 3D',
    'Usuarios y roles: admin, editor, host (login con Twitch)',
    'Historial: resultados de cada partida y ranking histórico del chat',
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Panel de administración</h1>
      <p className="text-white/70">En construcción (fase 2). Esto es lo que va a gestionar:</p>
      <ul className="space-y-2">
        {planned.map((item) => (
          <li key={item} className="rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
