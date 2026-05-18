import Pill from './Pill.jsx';
import { stageTone, signalTone, freshness, daysSince } from '../utils/scoring.js';

export default function FounderCard({ r, showSignal, onDraft, onEdit }) {
  const pct = Math.min(100, r.score);
  const days = daysSince(r.signalDate);
  const freshPct = (freshness(r.signalDate) * 100) | 0;

  return (
    <div className="founder">
      <div>
        <div className="founder-head">
          <span className="founder-name">{r.founder}</span>
          <span className="founder-co">· {r.company}</span>
          <span className="founder-meta">— {r.hq}</span>
        </div>
        <div className="founder-meta">
          {r.sector} · {r.stage} · {r.signalType} · {days === 0 ? 'today' : `${days}d ago`}
        </div>
        {showSignal && <div className="founder-signal">{r.summary}</div>}
        <div className="founder-pills">
          {r.soeu
            ? <Pill tone="accent" dot>Southern EU · {r.origin}</Pill>
            : <Pill tone="muted">{r.origin}</Pill>}
          <Pill tone={stageTone(r.stage)}>{r.stage}</Pill>
          <Pill tone={signalTone(r.signalType)}>{r.signalType}</Pill>
          <Pill tone="muted">{r.status}</Pill>
        </div>
      </div>
      <div className="founder-side">
        <div className="score-bar">
          <div className="score-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="score-label">score {r.score} · fresh {freshPct}%</div>
        <div className="founder-actions">
          {r.sourceUrl && (
            <a className="src" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
              {r.source || 'Source'} ↗
            </a>
          )}
          {r.linkedin && (
            <a className="src" href={r.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          )}
          {r.website && (
            <a className="src" href={r.website} target="_blank" rel="noopener noreferrer">Site ↗</a>
          )}
          <button onClick={() => onDraft(r.id)}>Draft outreach</button>
          <button onClick={() => onEdit(r.id)}>Edit</button>
        </div>
      </div>
    </div>
  );
}
