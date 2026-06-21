export const clinicConfig = {
  // Branding
  name: "Clinica Estetica",
  tagline: "Sistema de agendamiento Zeltra",
  primaryColor: "#1E40AF",
  accentColor: "#38BCD4",
  logoUrl: "/logo.png",

  // Main service being sold
  mainService: "Morpheus8",
  mainServicePrice: 1200000, // CLP

  // Lead sources (Meta Ads funnel)
  sources: [
    "Meta Ads",
    "Instagram Organico",
    "WhatsApp directo",
    "Referido",
    "Reactivacion base de datos",
  ],

  // Pipeline stages — Zeltra sales process
  stages: [
    {
      slug: "nuevo",
      nombre: "Nuevo Lead",
      color: "#6366f1",
      description: "Llego del formulario, aun no contactado",
    },
    {
      slug: "contactado",
      nombre: "Contactado",
      color: "#f59e0b",
      description: "Chatbot/equipo hizo primer contacto por WhatsApp",
    },
    {
      slug: "interesado",
      nombre: "Interesado",
      color: "#3b82f6",
      description: "Confirmo interes, pendiente de agendar",
    },
    {
      slug: "cita_agendada",
      nombre: "Cita Agendada",
      color: "#8b5cf6",
      description: "Cita confirmada en agenda de la clinica",
    },
    {
      slug: "reserva_con_deposito",
      nombre: "Reserva c/ Deposito",
      color: "#10b981",
      description: "Pago deposito — aqui se activa el cobro de Zeltra ($15.000)",
    },
    {
      slug: "perdido",
      nombre: "Perdido",
      color: "#ef4444",
      description: "No respondio o descarto el tratamiento",
    },
  ],

  // Monto que paga el lead al momento de reservar (cobrado via Flow)
  depositoReserva: 15000, // CLP — editable por clinica

  // Zeltra performance fee per reserva
  zeltraFeePerReserva: 15000, // CLP

  // Zeltra monthly cost (for ROI calc: setup + mensualidad)
  zeltraMonthlyCost: 766000, // CLP

  // Revenue goal (CLP) — used in dashboard alert
  monthlyRevenueGoal: 2000000,

  // Contact
  supportEmail: "soporte@zeltra.com",
}
