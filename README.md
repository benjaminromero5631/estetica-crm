# EstéticaCRM

CRM para clínicas estéticas — gestión de leads con pipeline visual, métricas y panel de detalle.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (Postgres)
- **@dnd-kit** (drag & drop en pipeline)
- **Vercel** (deployment)

## Variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## Setup local

```bash
git clone https://github.com/drona23/estetica-crm.git
cd estetica-crm
npm install
# crear .env.local con las variables de entorno
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Tablas requeridas en Supabase

- `leads` — nombre, telefono, email, servicio_interes, etapa, fuente, notas, valor_estimado
- `etapas_config` — nombre, slug, color, orden
