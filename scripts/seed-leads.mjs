import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const leads = [
  {
    nombre: 'Valentina Rojas',
    telefono: '+56 9 8421 7755',
    email: 'v.rojas@gmail.com',
    servicio_interes: 'Botox',
    etapa: 'nuevo',
    fuente: 'Instagram',
    valor_estimado: 150000,
  },
  {
    nombre: 'Matías Soto',
    telefono: '+56 9 7193 2048',
    email: 'msoto@gmail.com',
    servicio_interes: 'Depilación Láser',
    etapa: 'contactado',
    fuente: 'Web',
    valor_estimado: 280000,
  },
  {
    nombre: 'Francisca Araya',
    telefono: '+56 9 6650 8812',
    servicio_interes: 'Ácido Hialurónico',
    etapa: 'cita_agendada',
    fuente: 'Instagram',
    valor_estimado: 320000,
  },
  {
    nombre: 'Catalina Núñez',
    telefono: '+56 9 9284 6630',
    servicio_interes: 'Peeling Químico',
    etapa: 'convertido',
    fuente: 'Referido',
    valor_estimado: 95000,
  },
  {
    nombre: 'Joaquín Tapia',
    telefono: '+56 9 5037 4419',
    servicio_interes: 'Limpieza Facial Profunda',
    etapa: 'perdido',
    fuente: 'WhatsApp',
    valor_estimado: 75000,
  },
]

const { data, error } = await supabase.from('leads').insert(leads).select()

if (error) {
  console.error('Error al insertar:', error.message)
  console.error('Detalle:', error.details ?? error)
  process.exit(1)
}

console.log(`Insertados: ${data.length} leads`)
data.forEach((l) => console.log(`  - [${l.id}] ${l.nombre} → etapa: ${l.etapa}`))
