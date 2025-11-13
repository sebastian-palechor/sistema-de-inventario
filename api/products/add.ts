import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SUPABASE_URL } from '../../src/utils/supabase/info';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const url = `${SUPABASE_URL.replace(/\/+$/,'')}/rest/v1/productos`;
    const body = req.body;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY || '',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || ''}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
