const NAV = [
  { key: 'digest', label: 'Daily digest' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'kanban', label: 'Deal flow' },
  { key: 'settings', label: 'Settings' },
];

export default function Sidebar({ view, setView }) {
  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Beacon</div>
          <div className="brand-tag">first check · stealth · SoEU</div>
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
      <div className="side-ext">
        <a className="btn btn-block" href="/beacon-extension.zip" download>
          ⬇ Chrome extension
        </a>
        <div className="side-ext-hint">
          Scrapes Sales Navigator leads straight into Beacon. Unzip, then load
          via chrome://extensions → "Load unpacked".
        </div>
      </div>
      <div className="side-foot">
        <b>Beacon</b> surfaces stealth founders before anyone else sees them. Built for <b>first-check investing</b>: <b>stealth + pre-seed</b>, <b>EU/UK/IE</b> with a <b>Southern European</b> lens.<br /><br />
        All edits stored locally on this device.
      </div>
    </aside>
  );
}
