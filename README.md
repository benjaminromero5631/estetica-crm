# EstéticaCRM — Sistema de Gestión de Leads

## ¿Qué es esto?

CRM especializado para clínicas estéticas. Permite gestionar leads
desde que entran hasta que se convierten en clientes.

## Funcionalidades

- Dashboard con métricas en tiempo real
- Pipeline Kanban con 5 etapas personalizables
- Drag & drop entre etapas
- Panel de detalle por lead con historial
- Creación de leads manual
- Login seguro con usuario y contraseña

## Personalización rápida (para Zeltra)

Para adaptar a un nuevo cliente, editar solo `/lib/config.ts`:

| Campo | Descripción |
|---|---|
| `name` | Nombre de la clínica |
| `primaryColor` | Color principal en hex |
| `accentColor` | Color secundario en hex |
| `services` | Lista de servicios que ofrece |
| `logoUrl` | Ruta al logo en `/public/` |
| `supportEmail` | Email de soporte mostrado en el sistema |

## Setup nuevo cliente (paso a paso)

1. Fork este repositorio
2. Crear proyecto en Supabase → ejecutar `/scripts/schema.sql`
3. Ejecutar `/scripts/rls-policies.sql` en el SQL Editor de Supabase
4. Crear usuario en Supabase → Authentication → Users → Add user
5. Editar `/lib/config.ts` con datos del cliente
6. Agregar logo en `/public/logo.png`
7. Deploy en Vercel con las 3 variables de entorno (ver abajo)

**Tiempo estimado: 30 minutos**

## Variables de entorno necesarias

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Se configuran en Vercel → Project → Settings → Environment Variables.

## Desarrollo local

```bash
npm install
# crear .env.local con las variables de entorno
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Tablas requeridas en Supabase

- `leads` — nombre, telefono, email, servicio_interes, etapa, fuente, notas, valor_estimado
- `etapas_config` — nombre, slug, color, orden

## Stack técnico

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (base de datos + auth)
- **Vercel** (hosting)
- **dnd-kit** (drag and drop)

---

Desarrollado por Zeltra — zeltra.com
