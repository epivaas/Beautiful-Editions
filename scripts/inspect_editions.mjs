import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
    if (m) {
      let [, key, val] = m;
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing supabase env vars');
  process.exit(2);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect(ids) {
  const { data, error } = await supabase
    .from('editions')
    .select('*')
    .in('id', ids);
  if (error) {
    console.error('error', error);
    return;
  }
  for (const row of data) {
    console.log('---');
    console.log('id:', row.id);
    for (const k of Object.keys(row)) {
      console.log(k + ':', row[k]);
    }
  }
}

inspect([45,46]).then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
