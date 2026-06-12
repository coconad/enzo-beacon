import { useState, useCallback } from 'react';
import { scoreFor, isEarliest, daysSince, fmtDate, TODAY } from '../../utils/scoring.js';
import FounderCard from '../FounderCard.jsx';

export default function DigestView({ state, setEarliestOnly, onAdd, onEdit }) {
  const { records, weights, digestSize, earliestOnly } = state;
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const rerun = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefreshed(new Date());
    }, 600);
  }, []);

  const allRanked = records.map(r => ({ ...r, score: scoreFor(r, weights) })).sort((a, b) => b.score - a.score);
  const pool = earliestOnly ? allRanked.filter(isEarliest) : allRanked;
  const top = pool.slice(0, digestSize);

  const fresh = pool.filter(r => daysSince(r.signalDate) <= 7).length;
  const soeuCount = pool.filter(r => r.soeu).length;
  const stealth = pool.filter(r => r.stage === 'Stealth').length;
  const avg = Math.round(pool.reduce((a, r) => a + r.score, 0) / Math.max(1, pool.length)) || 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Daily digest</h1>
          <div className="page-sub">{fmtDate(TODAY)}</div>
        </div>
        <div className="toolbar">
          <label className="pill accent dot" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12.5px' }}>
            <input
              type="checkbox"
              checked={!!earliestOnly}
              onChange={e => setEarliestOnly(e.target.checked)}
              style={{ verticalAlign: 'middle', marginRight: 6 }}
            />
            Earliest stage only (Stealth + Pre-seed)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastRefreshed && !refreshing && (
              <span style={{ fontSize: 11, opacity: 0.5 }}>
                refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="btn" onClick={rerun} disabled={refreshing} style={{ minWidth: 120 }}>
              {refreshing ? '↻ Running…' : '↻ Rerun digest'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={onAdd}>+ Add founder</button>
        </div>
      </div>

      <div className="hero">
        <div>
          <h2>Stealth founders worth your attention today</h2>
          <p>First-check bias: founders found before they raise. Ranked by freshness × stage fit × Southern European angle × signal strength.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stat-label">tracking</div>
          <div className="stat">{pool.length}</div>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <div className="card"><div className="kpi-sub">Fresh this week</div><div className="kpi">{fresh}</div></div>
        <div className="card"><div className="kpi-sub">Southern Europe</div><div className="kpi">{soeuCount}</div></div>
        <div className="card"><div className="kpi-sub">In stealth</div><div className="kpi">{stealth}</div></div>
        <div className="card"><div className="kpi-sub">Avg. score</div><div className="kpi">{avg}</div></div>
      </div>

      <div style={{ transition: 'opacity 0.3s', opacity: refreshing ? 0.35 : 1 }}>
        {top.length === 0 ? (
          <div className="empty">
            No {earliestOnly ? 'stealth/pre-seed ' : ''}records match.{' '}
            {earliestOnly ? 'Toggle off "Earliest stage only" or add a founder.' : 'Add a founder.'}
          </div>
        ) : (
          top.map(r => (
            <FounderCard key={r.id} r={r} showSignal onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}
