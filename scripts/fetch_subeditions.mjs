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
      // strip surrounding quotes
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

async function getEdition(id) {
  const { data, error } = await supabase
    .from('editions')
    .select(`
      *,
      publisher:publishers(id,name),
      series:series(id,name),
      photos(id,storage_path,sort_order,caption),
      work:works(id,original_title,english_title,original_publication_year,original_language)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('getEdition error', error);
    return null;
  }
  return data;
}

async function findSubEditions(parentId) {
  const cols = ['parent_edition_id','parent_id','original_edition_id','edition_parent_id'];
  for (const col of cols) {
    const { data, error } = await supabase
      .from('editions')
      .select('id,title,publication_year,publisher:publishers(id,name),photos(id,storage_path,sort_order)')
      .eq(col, parentId)
      .order('publication_year', { ascending: true });
    if (!error && data && data.length) {
      return {col, data};
    }
  }
  return null;
}

(async () => {
  const editionId = parseInt(process.argv[2] || '245', 10);
  console.log('Fetching edition', editionId);
  const ed = await getEdition(editionId);
  if (!ed) {
    console.error('Edition not found');
    process.exit(1);
  }
  console.log('Edition:', { id: ed.id, title: ed.title, publication_year: ed.publication_year });

  const found = await findSubEditions(editionId);
  if (!found) {
    console.log('No sub-editions found using common parent columns.');
    process.exit(0);
  }
  console.log('Found sub-editions using column:', found.col);
  for (const s of found.data) {
    const photos = (s.photos||[]).sort((a,b)=>a.sort_order - b.sort_order);
    console.log(`- id=${s.id} title=${s.title||''} year=${s.publication_year||'—'} publisher=${s.publisher?.name||'—'} photos=${photos.length}`);
  }
})();
