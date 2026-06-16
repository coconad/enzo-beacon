import { useState } from 'react';
import { scoreFor, stageTone } from '../../utils/scoring.js';
import Pill from '../Pill.jsx';

export default function InboxView({ state, onAdd, onImport, onEdit, addToOutreach, removeFromOutreach }) {
  const { records, weights } = state;
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [signal, setSignal] = useState('');
  const [soeu, setSoeu] = useState('');
  const [sort, setSort] = useState({ col: 'score', dir: -1 });

  const rows = records
    .map(r => ({ ...r, score: scoreFor(r, weights) }))
    .filter(r => {
      if (stage && r.stage !== stage) return false;
      if (signal && r.signalType !== signal) return false;
      if (soeu === 'true' && !r.soeu) return false;
      if (soeu === 'false' && r.soeu) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const hay = [r.founder, r.company, r.hq, r.sector, r.origin, r.summary, r.notes, r.source].join(' ').toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      const A = a[sort.col], B = b[sort.col];
      if (typeof A === 'number' && typeof B === 'number') return (A - B) * sort.dir;
      return String(A).localeCompare(String(B)) * sort.dir;
    });

  function toggleSort(col) {
    setSort(prev => ({ col, dir: prev.col === col ? -prev.dir : (col === 'score' ? -1 : 1) }));
  }

  function reset() {
    setSearch(''); setStage(''); setSignal(''); setSoeu('');
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Inbox</h1>
          <div className="page-sub">Searchable record of every founder signal Beacon is tracking.</div>
        </div>
        <div className="toolbar">
          <button className="btn btn-primary" onClick={onImport}>⇪ Import CSV</button>
          <button className="btn btn-ghost" onClick={onAdd}>+ Add manually</button>
        </div>
      </div>

      <div className="inbox-bar">
        <input className="input" placeholder="Search founder, company, sector, city, keywords…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" value={stage} onChange={e => setStage(e.target.value)}>
          <option value="">All stages</option>
          <option>Stealth</option><option>Pre-seed</option><option>Seed</option>
          <option>Seed extension</option><option>Series A</option>
        </select>
        <select className="select" value={signal} onChange={e => setSignal(e.target.value)}>
          <option value="">All signals</option>
          <option>Funding</option><option>Launch</option><option>Career move</option>
          <option>Stealth exit</option><option>Accelerator</option>
        </select>
        <select className="select" value={soeu} onChange={e => setSoeu(e.target.value)}>
          <option value="">All geographies</option>
          <option value="true">Southern European angle only</option>
          <option value="false">No SoEU angle</option>
        </select>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No matches.</div>
      ) : (
        <table className="inbox-table">
          <thead>
            <tr>
              {[['score','Score'],['founder','Founder'],['company','Company'],['hq','HQ'],['stage','Stage'],['signalType','Signal'],['signalDate','Date'],['status','Status']].map(([col, label]) => (
                <th key={col} onClick={() => toggleSort(col)}>
                  {label}{sort.col === col ? (sort.dir === -1 ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="score">{r.score}</td>
                <td>
                  {r.founder}
                  {r.soeu && <span className="pill accent" style={{ marginLeft: 4 }}>SoEU</span>}
                </td>
                <td>{r.company}<div className="founder-meta">{r.sector}</div></td>
                <td>{r.hq}</td>
                <td><Pill tone={stageTone(r.stage)}>{r.stage}</Pill></td>
                <td>{r.signalType}</td>
                <td>{r.signalDate}</td>
                <td>{r.status}</td>
                <td className="row-actions">
                  <button
                    className={`star-btn${r.outreach ? ' on' : ''}`}
                    title={r.outreach ? 'On outreach list — click to remove' : 'Add to outreach list'}
                    aria-pressed={!!r.outreach}
                    onClick={() => (r.outreach ? removeFromOutreach(r.id) : addToOutreach(r.id))}
                  >
                    {r.outreach ? '★' : '☆'}
                  </button>
                  {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">↗</a>}
                  {' '}
                  <button className="btn btn-ghost" onClick={() => onEdit(r.id)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
