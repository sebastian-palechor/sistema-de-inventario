import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL } from '../../src/utils/supabase/info';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = `${SUPABASE_URL.replace(/\/+$/,'')}/rest/v1/productos?select=*`;
    const r = await fetch(url, { headers: { 
      'apikey': process.env.SUPABASE_SERVICE_KEY || '',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}`
    }});
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
