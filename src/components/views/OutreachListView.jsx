import { useState } from 'react';
import { scoreFor, stageTone, daysSince } from '../../utils/scoring.js';
import Pill from '../Pill.jsx';
import PillButton from '../ui/PillButton.jsx';

// Map a Beacon record to the payload the /api/attio-push function expects.
function toAttioPerson(r) {
  return {
    id: r.id,
    name: r.founder,
    company: r.company,
    hq: r.hq,
    summary: r.summary,
    stage: r.stage,
    signalType: r.signalType,
    score: r.score,
    linkedin: r.linkedin || r.sourceUrl || '',
    sourceUrl: r.sourceUrl || '',
    email: r.email || '',
  };
}

function LeadRow({ r, kind, onAdd, onDismiss, onRemove }) {
  const leftDays = r.leftJobDate ? daysSince(r.leftJobDate) : null;
  return (
    <div className="ol-row">
      <div className="ol-score">{r.score}</div>
      <div className="ol-body">
        <div className="ol-head">
          <span className="founder-name">{r.founder}</span>
          <span className="founder-co">· {r.company}</span>
          <span className="founder-meta">— {r.hq}</span>
        </div>
        <div className="ol-pills">
          {r.soeu && <Pill tone="accent" dot>SoEU</Pill>}
          <Pill tone={stageTone(r.stage)}>{r.stage}</Pill>
          <Pill tone="muted">{r.signalType}</Pill>
          {leftDays !== null && <Pill tone="gold" dot>left job {leftDays}d ago</Pill>}
          {r.pushedAt && <Pill tone="sea" dot>in Attio</Pill>}
        </div>
      </div>
      <div className="ol-actions">
        {r.linkedin && (
          <a className="src" href={r.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
        )}
        {kind === 'suggested' ? (
          <>
            <button className="ol-add" onClick={() => onAdd(r.id)}>+ Add</button>
            <button className="ol-dismiss" onClick={() => onDismiss(r.id)}>Dismiss</button>
          </>
        ) : (
          <button className="ol-dismiss" onClick={() => onRemove(r.id)}>Remove</button>
        )}
      </div>
    </div>
  );
}

export default function OutreachListView({
  state, addToOutreach, removeFromOutreach, dismissSuggestion, markPushed, onToast, onGoSettings,
}) {
  const { records, weights, attio } = state;
  const threshold = attio?.threshold ?? 70;
  const listId = attio?.listId || '';
  const [busy, setBusy] = useState(false);

  const ranked = records
    .map(r => ({ ...r, score: scoreFor(r, weights) }))
    .sort((a, b) => b.score - a.score);

  const priority = ranked.filter(r => r.outreach);
  const suggested = ranked.filter(r => !r.outreach && !r.outreachDismissed && r.score >= threshold);

  const unpushed = priority.filter(r => !r.pushedAt);

  async function pushToAttio() {
    if (!listId) { onToast('Set your Attio list in Settings first'); return; }
    if (!unpushed.length) { onToast('Nothing new to push — all leads are already in Attio'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/attio-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, people: unpushed.map(toAttioPerson) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast(data.error || `Push failed (${res.status})`);
      } else {
        if (data.pushedIds?.length) markPushed(data.pushedIds);
        const failNote = data.failed ? ` · ${data.failed} failed` : '';
        onToast(`✓ Pushed ${data.pushed} to Attio${failNote}`);
      }
    } catch {
      onToast('Push failed — check the Attio key in Vercel and try again');
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Outreach list</h1>
          <div className="page-sub">
            Curate a priority list from your highest-signal leads, then push it to Attio.
          </div>
        </div>
        <div className="toolbar">
          <PillButton
            variant="primary"
            onClick={pushToAttio}
            disabled={busy || !priority.length}
            title={!listId ? 'Set your Attio list in Settings' : undefined}
          >
            {busy ? 'Pushing…' : `⇪ Push ${unpushed.length} to Attio`}
          </PillButton>
        </div>
      </div>

      {!listId && (
        <div className="ol-banner">
          Connect your Attio People list to enable one-click push.{' '}
          <button className="link-btn" onClick={onGoSettings}>Open Settings →</button>
        </div>
      )}

      <div className="ol-grid">
        {/* Priority list */}
        <section className="ol-col">
          <div className="ol-col-head">
            <h3>Priority list</h3>
            <span className="ol-count">{priority.length}</span>
          </div>
          {priority.length === 0 ? (
            <div className="empty">
              No leads yet. Add from suggestions on the right, or star high scorers in the Inbox.
            </div>
          ) : (
            priority.map(r => (
              <LeadRow key={r.id} r={r} kind="priority" onRemove={removeFromOutreach} />
            ))
          )}
        </section>

        {/* Suggestions */}
        <section className="ol-col">
          <div className="ol-col-head">
            <h3>Suggested <span className="ol-sub">score ≥ {threshold}</span></h3>
            <span className="ol-count">{suggested.length}</span>
          </div>
          {suggested.length === 0 ? (
            <div className="empty">
              No new suggestions above the threshold. Lower it in Settings, or import more leads.
            </div>
          ) : (
            suggested.map(r => (
              <LeadRow key={r.id} r={r} kind="suggested" onAdd={addToOutreach} onDismiss={dismissSuggestion} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
