import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL } from '../../src/utils/supabase/info';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { id, ...fields } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required in body' });
    const url = `${SUPABASE_URL.replace(/\/+$/,'')}/rest/v1/productos?id=eq.${id}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fields)
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
