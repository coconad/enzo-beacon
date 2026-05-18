import { useRef } from 'react';
import { SOURCES, DEFAULTS } from '../../data/seed.js';
import { scoreFor, TODAY } from '../../utils/scoring.js';

function buildSlackDigest(state) {
  const ranked = state.records.map(r => ({ ...r, score: scoreFor(r, state.weights) })).sort((a, b) => b.score - a.score).slice(0, state.digestSize);
  const lines = [`*Beacon — ${TODAY.toLocaleDateString()}*`, `Top ${ranked.length} founder signals`, ''];
  ranked.forEach((r, i) => {
    lines.push(`${i+1}. *${r.company}* — ${r.founder} (${r.hq}) — _${r.stage} · ${r.signalType}_  · score *${r.score}*`);
    lines.push(`    ${r.summary}`);
    if (r.sourceUrl) lines.push(`    <${r.sourceUrl}|${r.source || 'source'}>`);
  });
  return lines.join('\n');
}

export default function SettingsView({ state, setWeights, resetWeights, setDigestSize, setSlackWebhook, importState, resetToSeed, onToast }) {
  const { weights, digestSize, slackWebhook } = state;
  const fileRef = useRef();

  function updateWeight(key, val) {
    setWeights({ ...weights, [key]: +val });
  }

  async function postSlack(text) {
    if (!slackWebhook) { onToast('No webhook configured'); return; }
    try {
      await fetch(slackWebhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      onToast('Posted to Slack (or queued — no-cors mode)');
    } catch {
      onToast('Direct POST blocked. Use the preview below to paste manually.');
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `beacon-${TODAY.toISOString().slice(0, 10)}.json`;
    a.click();
  }

  async function handleImport(e) {
    const f = e.target.files[0]; if (!f) return;
    const txt = await f.text();
    try { importState(JSON.parse(txt)); onToast('Imported'); }
    catch { onToast('Import failed'); }
  }

  function handleReset() {
    if (!confirm('Reset to seed dataset? Local edits will be lost.')) return;
    resetToSeed(slackWebhook);
    onToast('Reset');
  }

  const slackPreview = buildSlackDigest(state);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Tune the ranking, wire alerts, manage data.</div>
        </div>
      </div>

      <div className="settings">
        <div className="card">
          <h3>Ranking weights</h3>
          <div className="page-sub" style={{ marginBottom: 10 }}>
            Score = (freshness × w<sub>f</sub>) + (stage fit × w<sub>s</sub>) + (SoEU angle × w<sub>g</sub>) + (signal strength × w<sub>q</sub>)
          </div>
          {[
            ['fresh', 'Freshness'],
            ['stage', 'Stage fit (pre-seed/seed)'],
            ['soeu', 'Southern Europe angle'],
            ['signal', 'Signal strength'],
          ].map(([key, label]) => (
            <div className="weight-row" key={key}>
              <div>{label}</div>
              <input type="range" min="0" max="100" value={weights[key]} onChange={e => updateWeight(key, e.target.value)} />
              <div className="val">{weights[key]}</div>
            </div>
          ))}
          <button className="btn" style={{ marginTop: 8 }} onClick={() => { resetWeights(); onToast('Weights reset'); }}>
            Reset to defaults
          </button>
        </div>

        <div className="card">
          <h3>Slack alerts</h3>
          <div className="page-sub" style={{ marginBottom: 8 }}>
            Paste an incoming-webhook URL from a private Slack channel. Beacon will post the top-N digest there.
          </div>
          <input
            className="input"
            placeholder="https://hooks.slack.com/services/…"
            value={slackWebhook || ''}
            onChange={e => setSlackWebhook(e.target.value.trim())}
            style={{ width: '100%', marginBottom: 8 }}
          />
          <div className="weight-row">
            <div>Digest size</div>
            <input type="range" min="3" max="20" value={digestSize} onChange={e => setDigestSize(+e.target.value)} />
            <div className="val">{digestSize}</div>
          </div>
          <button className="btn" onClick={() => postSlack(`*Beacon* test ping — ${TODAY.toLocaleDateString()}`)}>Send test ping</button>{' '}
          <button className="btn" onClick={() => postSlack(slackPreview)}>Send digest now</button>
          <div className="page-sub" style={{ marginTop: 8 }}>
            If your browser blocks direct Slack POSTs, copy the digest below and paste in Slack.
          </div>
          <textarea
            value={slackPreview}
            readOnly
            style={{ width: '100%', minHeight: 140, marginTop: 8, fontFamily: 'var(--mono)', fontSize: 12 }}
          />
        </div>

        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>Signal sources Beacon is monitoring</h3>
          <div className="page-sub" style={{ marginBottom: 8 }}>
            Open these in the morning to scan for new entries. Drop the URL into "Add founder" with notes and Beacon scores it automatically.
          </div>
          <div className="grid cols-3">
            {SOURCES.map(s => (
              <div className="card" key={s.url}>
                <h3><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></h3>
                <div className="page-sub">{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1/-1' }}>
          <h3>Data</h3>
          <div className="page-sub" style={{ marginBottom: 8 }}>
            Beacon stores everything in your browser's local storage. Export to back up; import to restore on another machine.
          </div>
          <button className="btn" onClick={exportJson}>Export JSON</button>{' '}
          <button className="btn" onClick={() => fileRef.current.click()}>Import JSON…</button>{' '}
          <button className="btn" style={{ color: 'var(--warn)' }} onClick={handleReset}>Reset to seed dataset</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>
    </div>
  );
}
