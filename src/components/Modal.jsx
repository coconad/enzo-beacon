import { useState } from 'react';
import { TODAY } from '../utils/scoring.js';

const EMPTY = {
  founder: '', company: '', hq: '', sector: '', stage: 'Pre-seed',
  signalType: 'Funding', signalDate: TODAY.toISOString().slice(0, 10),
  leftJobDate: '', summary: '', origin: '', soeu: 'false',
  sourceUrl: '', source: '', linkedin: '', website: '', notes: '',
};

export default function Modal({ open, record, onSave, onClose, onToast }) {
  const [form, setForm] = useState(EMPTY);

  // Re-initialise the form whenever the modal (re)opens — state adjustment
  // during render instead of an effect, so there's no cascading render.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(record
        ? {
            ...record,
            soeu: String(!!record.soeu),
            signalDate: record.signalDate || TODAY.toISOString().slice(0, 10),
            leftJobDate: record.leftJobDate || '',
          }
        : EMPTY);
    }
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.founder.trim() || !form.company.trim()) {
      onToast('Founder and company required');
      return;
    }
    const rec = {
      id: record?.id || ('f' + Date.now()),
      ...form,
      founder: form.founder.trim(),
      company: form.company.trim(),
      hq: form.hq.trim(),
      sector: form.sector.trim(),
      summary: form.summary.trim(),
      origin: form.origin.trim(),
      soeu: form.soeu === 'true',
      sourceUrl: form.sourceUrl.trim(),
      source: form.source.trim(),
      linkedin: form.linkedin.trim(),
      website: form.website.trim(),
      notes: form.notes.trim(),
      status: record?.status || 'New',
    };
    onSave(rec);
    onClose();
    onToast(record ? 'Updated' : 'Added');
  }

  return (
    <div className={`modal-bg${open ? ' show' : ''}`} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="mclose" onClick={onClose}>×</button>
        <h3>{record ? 'Edit founder' : 'Add founder'}</h3>
        <div className="page-sub">Paste what you found from a public source.</div>

        <div className="field">
          <label>Founder name(s)</label>
          <input className="input" value={form.founder} onChange={e => set('founder', e.target.value)} />
        </div>
        <div className="row">
          <div className="field"><label>Company</label><input className="input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
          <div className="field"><label>HQ city</label><input className="input" placeholder="Milan, London, Lisbon…" value={form.hq} onChange={e => set('hq', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Sector</label><input className="input" placeholder="AI / B2B SaaS / Fintech…" value={form.sector} onChange={e => set('sector', e.target.value)} /></div>
          <div className="field">
            <label>Stage</label>
            <select className="select input" value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option>Stealth</option><option>Pre-seed</option><option>Seed</option>
              <option>Seed extension</option><option>Series A</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Signal type</label>
            <select className="select input" value={form.signalType} onChange={e => set('signalType', e.target.value)}>
              <option>Funding</option><option>Launch</option><option>Career move</option>
              <option>Stealth exit</option><option>Accelerator</option>
            </select>
          </div>
          <div className="field"><label>Signal date</label><input className="input" type="date" value={form.signalDate} onChange={e => set('signalDate', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Left last job (date)</label><input className="input" type="date" value={form.leftJobDate} onChange={e => set('leftJobDate', e.target.value)} /></div>
          <div className="field" />
        </div>
        <div className="field">
          <label>One-line signal summary</label>
          <input className="input" placeholder="Raised €4.2M seed led by a16z…" value={form.summary} onChange={e => set('summary', e.target.value)} />
        </div>
        <div className="row">
          <div className="field"><label>Founder origin</label><input className="input" placeholder="Italian, Spanish, Greek, …" value={form.origin} onChange={e => set('origin', e.target.value)} /></div>
          <div className="field">
            <label>SoEU angle?</label>
            <select className="select input" value={form.soeu} onChange={e => set('soeu', e.target.value)}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field"><label>Source URL</label><input className="input" placeholder="https://…" value={form.sourceUrl} onChange={e => set('sourceUrl', e.target.value)} /></div>
          <div className="field"><label>Source name</label><input className="input" placeholder="Sifted, EU-Startups…" value={form.source} onChange={e => set('source', e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label>LinkedIn (founder)</label><input className="input" placeholder="https://linkedin.com/in/…" value={form.linkedin} onChange={e => set('linkedin', e.target.value)} /></div>
          <div className="field"><label>Website (company)</label><input className="input" placeholder="https://…" value={form.website} onChange={e => set('website', e.target.value)} /></div>
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Why interesting, who knows them, what to ask…" />
        </div>
        <div style={{ textAlign: 'right', marginTop: 14 }}>
          <button className="btn" onClick={onClose}>Cancel</button>{' '}
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
