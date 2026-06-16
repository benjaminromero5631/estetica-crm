export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">¡Cita agendada!</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Tu cita fue registrada correctamente. Nos pondremos en contacto contigo para confirmar los detalles.
        </p>
        <a
          href="/agendar"
          className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-700"
        >
          Agendar otra cita
        </a>
      </div>
    </div>
  )
}
