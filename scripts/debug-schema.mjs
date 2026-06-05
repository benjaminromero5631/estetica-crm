import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: leads } = await supabase.from('leads').select('*').limit(2)
console.log('=== leads (2 rows) ===')
console.log(JSON.stringify(leads, null, 2))

const { data: etapas } = await supabase.from('etapas_config').select('*').order('orden')
console.log('\n=== etapas_config ===')
console.log(JSON.stringify(etapas, null, 2))
