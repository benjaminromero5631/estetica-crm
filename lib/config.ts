export const clinicConfig = {
  // Branding
  name: "EstéticaCRM",
  tagline: "Gestión de leads para clínicas estéticas",
  primaryColor: "#1E40AF",
  accentColor: "#38BCD4",
  logoUrl: "/logo.png",

  // Services (shown in NewLeadModal select)
  services: [
    "Botox",
    "Rellenos dérmicos",
    "Limpieza facial",
    "Diseño de cejas",
    "Mesoterapia",
    "Depilación láser",
    "Ácido hialurónico",
    "Peeling químico",
    "Otro",
  ],

  // Pipeline stages (must match Supabase etapas_config slugs)
  stages: [
    { slug: "nuevo", nombre: "Nuevo Lead", color: "#6366f1" },
    { slug: "contactado", nombre: "Contactado", color: "#f59e0b" },
    { slug: "cita_agendada", nombre: "Cita Agendada", color: "#3b82f6" },
    { slug: "convertido", nombre: "Convertido", color: "#10b981" },
    { slug: "perdido", nombre: "Perdido", color: "#ef4444" },
  ],

  // Contact
  supportEmail: "soporte@zeltra.com",
}
