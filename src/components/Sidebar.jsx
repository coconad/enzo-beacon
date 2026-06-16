import FloatingNav from './ui/FloatingNav.jsx';

const NAV = [
  { key: 'digest', label: 'Daily digest' },
  { key: 'inbox', label: 'Inbox' },
  { key: 'outreach', label: 'Outreach list' },
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
      <FloatingNav items={NAV} active={view} onSelect={setView} />
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
        <b>Beacon</b> filters your Sales Navigator leads into a <b>priority outreach list</b>, ready to push to <b>Attio</b>. Bias: <b>first-check</b>, stealth + pre-seed, with a Southern European lens.<br /><br />
        All edits stored locally on this device.
      </div>
    </aside>
  );
}
