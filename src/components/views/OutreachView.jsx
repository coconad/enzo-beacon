import { useState, useEffect } from 'react';
import { scoreFor } from '../../utils/scoring.js';
import { generateDraft } from '../../utils/drafts.js';

const TONES = [
  { key: 'warm', label: 'Warm intro' },
  { key: 'punchy', label: 'Punchy' },
  { key: 'thoughtful', label: 'Thoughtful angle' },
  { key: 'italian', label: 'Italian (IT)' },
  { key: 'spanish', label: 'Spanish (ES)' },
];

export default function OutreachView({ state, selectedId, setSelectedId, onToast }) {
  const { records, weights } = state;
  const [search, setSearch] = useState('');
  const [tone, setTone] = useState('warm');

  const ranked = records.map(r => ({ ...r, score: scoreFor(r, weights) })).sort((a, b) => b.score - a.score);
  const filtered = ranked.filter(r => {
    if (!search.trim()) return true;
    return (r.founder + r.company + r.sector + r.hq).toLowerCase().includes(search.toLowerCase());
  });

  const selected = records.find(r => r.id === selectedId) || filtered[0];
  const selectedWithScore = selected ? { ...selected, score: scoreFor(selected, weights) } : null;
  const draft = selectedWithScore ? generateDraft(selectedWithScore, tone) : { subject: '', body: '' };

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].id);
  }, []);

  function copyDraft() {
    const text = `${draft.subject}\n\n${draft.body}`;
    navigator.clipboard?.writeText(text).then(() => onToast('Copied'), () => onToast('Copy failed'));
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Outreach drafts</h1>
          <div className="page-sub">Pick a founder, generate a personalised cold note. Drafts are templates — review before sending.</div>
        </div>
      </div>

      <div className="outreach-grid">
        <div>
          <input
            className="input"
            placeholder="Find a founder…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <div className="target-list">
            {filtered.map(r => (
              <div
                key={r.id}
                className={`target-item${r.id === (selected?.id) ? ' selected' : ''}`}
                onClick={() => setSelectedId(r.id)}
              >
                <h4>{r.founder}</h4>
                <div className="ksub">{r.company} · {r.hq} · score {r.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="draft-area">
          <div className="draft-meta">
            <div>Tone</div>
            <div className="tone-toggle">
              {TONES.map(t => (
                <button
                  key={t.key}
                  className={tone === t.key ? 'active' : ''}
                  onClick={() => setTone(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-primary" onClick={copyDraft}>Copy draft</button>
            </div>
          </div>
          {draft.subject && <div style={{ fontWeight: 600, marginBottom: 6 }}>{draft.subject}</div>}
          <textarea
            value={draft.body}
            readOnly
            placeholder="Select a founder on the left to generate a draft."
          />
          <div className="page-sub" style={{ marginTop: 8 }}>
            Draft is generated locally from the signal + your angle. Always personalise the first line with something only you would notice.
          </div>
        </div>
      </div>
    </div>
  );
}
