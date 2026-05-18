import { useState } from 'react';
import { scoreFor, stageTone, normaliseStatus } from '../../utils/scoring.js';
import { KSTAGES } from '../../data/seed.js';
import Pill from '../Pill.jsx';

function KanbanCard({ r, onEdit }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`kcard${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={e => { setDragging(true); e.dataTransfer.setData('text/plain', r.id); }}
      onDragEnd={() => setDragging(false)}
      onClick={() => onEdit(r.id)}
    >
      <h4>{r.company}</h4>
      <div className="ksub">{r.founder} · {r.hq}</div>
      <div className="kpills">
        {r.soeu && <Pill tone="accent">SoEU</Pill>}
        <Pill tone={stageTone(r.stage)}>{r.stage}</Pill>
        <Pill tone="muted">score {r.score}</Pill>
      </div>
    </div>
  );
}

function KanbanCol({ stage, cards, onDrop, onEdit }) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={`kcol${over ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        onDrop(id, stage);
      }}
    >
      <div className="kcol-head">
        <div className="kcol-name">{stage}</div>
        <div className="kcol-count">{cards.length}</div>
      </div>
      {cards.map(r => <KanbanCard key={r.id} r={r} onEdit={onEdit} />)}
    </div>
  );
}

export default function KanbanView({ state, moveRecord, onEdit, onToast }) {
  const { records, weights } = state;
  const ranked = records.map(r => ({ ...r, score: scoreFor(r, weights) })).sort((a, b) => b.score - a.score);

  function handleDrop(id, stage) {
    const rec = records.find(r => r.id === id);
    if (rec && normaliseStatus(rec.status) !== stage) {
      moveRecord(id, stage);
      onToast(`Moved ${rec.company} → ${stage}`);
    }
  }

  function exportSummary() {
    const lines = KSTAGES.map(st => {
      const items = ranked.filter(r => normaliseStatus(r.status) === st);
      return `${st} (${items.length})\n` + items.map(r => `  • ${r.company} — ${r.founder} (${r.hq})  score:${r.score}`).join('\n');
    }).join('\n\n');
    navigator.clipboard?.writeText(lines).then(() => onToast('Copied'), () => onToast('Copy failed'));
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Deal flow</h1>
          <div className="page-sub">Drag founders across stages as you progress conversations.</div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={exportSummary}>Copy summary</button>
        </div>
      </div>
      <div className="kanban">
        {KSTAGES.map(st => (
          <KanbanCol
            key={st}
            stage={st}
            cards={ranked.filter(r => normaliseStatus(r.status) === st)}
            onDrop={handleDrop}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
