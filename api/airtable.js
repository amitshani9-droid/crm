import Airtable from 'airtable';

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Table 1';

export default async function handler(req, res) {
  if (!AIRTABLE_PAT || !BASE_ID) {
    return res.status(500).json({ error: 'Airtable environment variables missing' });
  }

  if (!INTERNAL_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (req.headers['x-internal-secret'] !== INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(BASE_ID);
  const { method, body, query } = req;

  try {
    switch (method) {
      case 'GET':
        const records = await base(TABLE_NAME).select().all();
        return res.status(200).json(records.map(r => ({ id: r.id, createdTime: r._rawJson.createdTime, ...r.fields })));

      case 'POST':
        // Handle both single and batch creation
        const toCreate = Array.isArray(body) ? body : [body];
        const created = await base(TABLE_NAME).create(toCreate);
        return res.status(200).json(created);

      case 'PATCH':
        // Handle both single and batch updates
        const toUpdate = Array.isArray(body) ? body : [body];
        const updated = await base(TABLE_NAME).update(toUpdate);
        return res.status(200).json(updated);

      case 'DELETE':
        const { id } = query;
        if (!id) return res.status(400).json({ error: 'Record ID missing' });
        await base(TABLE_NAME).destroy(id);
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Airtable API Proxy Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
