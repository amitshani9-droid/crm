import Airtable from 'airtable';
import { timingSafeEqual } from 'crypto';

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Table 1';

const ALLOWED_FIELDS = ['Name', 'Company', 'Phone', 'Email', 'Event Type', 'Event Date', 'Notes', 'Status', 'Budget', 'Participants', 'Priority', 'Quote Sent', 'Attachments'];
const ALLOWED_STATUSES = ['פניות חדשות', 'בטיפול', 'סגור'];
const MAX_BATCH = 10;

export function sanitizeFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null;
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (!(key in fields)) continue;
    const val = fields[key];
    if (key === 'Status') {
      if (ALLOWED_STATUSES.includes(val)) out[key] = val;
    } else if (key === 'Quote Sent') {
      out[key] = Boolean(val);
    } else if (key === 'Attachments') {
      if (Array.isArray(val)) out[key] = val;
    } else if (key === 'Budget' || key === 'Participants') {
      const n = Number(val);
      if (!isNaN(n)) out[key] = n;
    } else {
      out[key] = String(val ?? '').slice(0, 2000);
    }
  }
  return out;
}

function checkSecret(provided) {
  if (!INTERNAL_SECRET) return false;
  const a = Buffer.from(provided || '');
  const b = Buffer.from(INTERNAL_SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (!AIRTABLE_PAT || !BASE_ID || !INTERNAL_SECRET) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!checkSecret(req.headers['x-internal-secret'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const base = new Airtable({ apiKey: AIRTABLE_PAT }).base(BASE_ID);
  const { method, body, query } = req;

  try {
    switch (method) {
      case 'GET': {
        const records = await base(TABLE_NAME).select().all();
        return res.status(200).json(records.map(r => ({ id: r.id, createdTime: r._rawJson.createdTime, ...r.fields })));
      }
      case 'POST': {
        const toCreate = Array.isArray(body) ? body : [body];
        if (toCreate.length > MAX_BATCH) return res.status(400).json({ error: 'Too many records' });
        const sanitized = toCreate.map(item => ({ fields: sanitizeFields(item.fields ?? item) })).filter(item => item.fields);
        if (!sanitized.length) return res.status(400).json({ error: 'Invalid fields' });
        const created = await base(TABLE_NAME).create(sanitized);
        return res.status(200).json(created);
      }
      case 'PATCH': {
        const toUpdate = Array.isArray(body) ? body : [body];
        if (toUpdate.length > MAX_BATCH) return res.status(400).json({ error: 'Too many records' });
        const sanitized = toUpdate.map(item => ({ id: item.id, fields: sanitizeFields(item.fields) })).filter(item => item.id && item.fields);
        if (!sanitized.length) return res.status(400).json({ error: 'Invalid fields' });
        const updated = await base(TABLE_NAME).update(sanitized);
        return res.status(200).json(updated);
      }
      case 'DELETE': {
        const { id } = query;
        if (!id) return res.status(400).json({ error: 'Record ID missing' });
        await base(TABLE_NAME).destroy(id);
        return res.status(200).json({ success: true });
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Airtable API Proxy Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
