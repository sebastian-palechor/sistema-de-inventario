import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL } from '../../src/utils/supabase/info';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: 'id query param is required' });
    const url = `${SUPABASE_URL.replace(/\/+$/,'')}/rest/v1/productos?id=eq.${id}`;
    const r = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}`
      }
    });
    const data = await r.json().catch(()=>({}));
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
