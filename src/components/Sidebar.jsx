const NAV = [
  { key: 'digest', label: 'Daily digest' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'kanban', label: 'Deal flow' },
  { key: 'outreach', label: 'Outreach drafts' },
  { key: 'settings', label: 'Settings' },
];

export default function Sidebar({ view, setView }) {
  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Beacon</div>
          <div className="brand-tag">stealth · pre-seed · SoEU</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map(n => (
          <button
            key={n.key}
            className={view === n.key ? 'active' : ''}
            onClick={() => setView(n.key)}
          >
            <span className="dot" />
            {n.label}
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <b>Beacon</b> aggregates public signals into a private deal-flow workspace. Bias: <b>stealth + pre-seed</b> only, <b>EU/UK/IE</b> with a <b>Southern European</b> lens.<br /><br />
        All edits stored locally on this device.
      </div>
    </aside>
  );
}
