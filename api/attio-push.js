// Vercel serverless function — pushes a curated outreach list into Attio.
//
// The Attio API key is read from the ATTIO_API_KEY env var (set in the Vercel
// project settings) and never leaves the server. The browser calls this
// same-origin route, so there is no CORS issue and the key is never exposed.
//
// Body: { listId: string, people: Person[], test?: boolean }
//   Person = { id, name, company, hq, summary, stage, signalType, score,
//              linkedin, sourceUrl, email }
//
// Returns: { pushed: number, failed: number, pushedIds: string[], errors: [] }

const ATTIO = 'https://api.attio.com/v2';

async function attio(path, { method = 'GET', key, body } = {}) {
  const res = await fetch(ATTIO + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

function splitName(full) {
  const parts = (full || '').trim().split(/\s+/);
  if (parts.length < 2) return { first_name: full || '', last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

// Compose the Attio People `values` payload from a Beacon lead. We only set
// standard People attributes so this works on any workspace without custom
// schema. LinkedIn + context go into `description` (the actionable bits).
function toPersonValues(p) {
  const { first_name, last_name } = splitName(p.name);
  const description = [
    p.company && `Company: ${p.company}`,
    p.hq && `Location: ${p.hq}`,
    (p.stage || p.signalType) && `Signal: ${[p.stage, p.signalType].filter(Boolean).join(' · ')}`,
    typeof p.score === 'number' && `Beacon score: ${p.score}`,
    p.summary && `\n${p.summary}`,
    p.linkedin && `\nLinkedIn: ${p.linkedin}`,
    p.sourceUrl && `Source: ${p.sourceUrl}`,
  ].filter(Boolean).join('\n');

  const values = {
    name: [{ first_name, last_name, full_name: p.name }],
    description,
  };
  if (p.email) values.email_addresses = [p.email];
  return values;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.ATTIO_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'ATTIO_API_KEY is not set on the server. Add it in Vercel → Project → Settings → Environment Variables.' });
    return;
  }

  const { listId, people, test } = req.body || {};

  // Connection test: verify the key and (if given) the list are reachable.
  if (test) {
    const probe = listId ? await attio(`/lists/${listId}`, { key }) : await attio('/self', { key });
    if (!probe.ok) {
      res.status(probe.status || 502).json({
        error: probe.json?.error?.message || `Attio returned ${probe.status}. Check the API key${listId ? ' and list ID' : ''}.`,
      });
      return;
    }
    res.status(200).json({ ok: true, workspace: probe.json?.data?.name || probe.json?.data?.workspace_name || 'connected' });
    return;
  }

  if (!listId) { res.status(400).json({ error: 'No Attio list configured.' }); return; }
  if (!Array.isArray(people) || people.length === 0) { res.status(400).json({ error: 'No people to push.' }); return; }

  const pushedIds = [];
  const errors = [];

  for (const p of people) {
    try {
      // 1) Assert by email when available (dedupes); otherwise create.
      let record;
      if (p.email) {
        const r = await attio('/objects/people/records?matching_attribute=email_addresses', {
          method: 'PUT', key, body: { data: { values: toPersonValues(p) } },
        });
        if (!r.ok) throw new Error(r.json?.error?.message || `assert failed (${r.status})`);
        record = r.json?.data;
      } else {
        const r = await attio('/objects/people/records', {
          method: 'POST', key, body: { data: { values: toPersonValues(p) } },
        });
        if (!r.ok) throw new Error(r.json?.error?.message || `create failed (${r.status})`);
        record = r.json?.data;
      }

      const recordId = record?.id?.record_id;
      if (!recordId) throw new Error('no record id returned');

      // 2) Add the person record to the target list.
      const entry = await attio(`/lists/${listId}/entries`, {
        method: 'POST', key,
        body: { data: { parent_record_id: recordId, parent_object: 'people', entry_values: {} } },
      });
      if (!entry.ok) throw new Error(entry.json?.error?.message || `list add failed (${entry.status})`);

      pushedIds.push(p.id);
    } catch (e) {
      errors.push({ id: p.id, name: p.name, error: String(e.message || e) });
    }
  }

  res.status(200).json({
    pushed: pushedIds.length,
    failed: errors.length,
    pushedIds,
    errors,
  });
}
