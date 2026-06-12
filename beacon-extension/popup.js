// popup.js — logic for Beacon's Sales Navigator Bridge popup

const QUEUE_KEY    = 'beacon.salesnav.queue';
const SETTINGS_KEY = 'beacon.extension.settings';

let scrapedLeads = [];   // leads from the most recent scan
let selectedIds  = new Set();

// ─────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkCurrentTab();
  await refreshQueueBanner();
  await loadSettings();
});

// ─────────────────────────────────────────────
// Tab status
// ─────────────────────────────────────────────
async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const scanBtn = document.getElementById('btn-scan');

  const url = tab?.url || '';

  if (url.includes('linkedin.com/sales/lead/') || url.includes('linkedin.com/sales/people/')) {
    dot.className = 'dot green';
    text.textContent = 'Lead profile — ready to scan';
  } else if (url.includes('linkedin.com/sales/search/')) {
    dot.className = 'dot green';
    text.textContent = 'Search results — ready to scan';
  } else if (url.includes('linkedin.com/sales/')) {
    dot.className = 'dot amber';
    text.textContent = 'Sales Navigator open — go to a lead or search';
    scanBtn.disabled = true;
  } else {
    dot.className = 'dot red';
    text.textContent = 'Not on Sales Navigator';
    scanBtn.disabled = true;
  }
}

// ─────────────────────────────────────────────
// Scan page
// ─────────────────────────────────────────────
document.getElementById('btn-scan').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  document.getElementById('empty-msg').textContent = 'Scanning…';
  document.getElementById('empty-msg').style.display = 'block';
  document.getElementById('lead-list').style.display = 'none';
  document.getElementById('btn-add').style.display = 'none';

  try {
    // content.js is already injected via manifest; send it a message
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });
    scrapedLeads = resp?.leads || [];
  } catch (_) {
    // Fallback: inject content.js manually (e.g. tab was open before extension install)
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
      await delay(150);
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'scrape' });
      scrapedLeads = resp?.leads || [];
    } catch (e2) {
      showEmpty('Could not scan. Try refreshing the Sales Navigator tab, then scan again.');
      return;
    }
  }

  selectedIds = new Set(scrapedLeads.map(l => l.id));
  renderLeadList();
});

// ─────────────────────────────────────────────
// Render lead list
// ─────────────────────────────────────────────
function renderLeadList() {
  const listEl  = document.getElementById('lead-list');
  const emptyEl = document.getElementById('empty-msg');
  const addBtn  = document.getElementById('btn-add');

  if (scrapedLeads.length === 0) {
    showEmpty('No leads found on this page. Try a lead profile or search results page with visible results.');
    return;
  }

  emptyEl.style.display = 'none';
  listEl.style.display  = 'flex';
  addBtn.style.display  = 'block';
  addBtn.textContent    = `Add ${scrapedLeads.length} selected to queue`;
  listEl.innerHTML      = '';

  scrapedLeads.forEach(lead => {
    const el = document.createElement('div');
    el.className = 'lead-item' + (selectedIds.has(lead.id) ? ' checked' : '');

    const pills = [];
    if (lead.soeu)    pills.push('<span class="pill accent">SoEU</span>');
    if (lead.stage)   pills.push(`<span class="pill olive">${esc(lead.stage)}</span>`);

    el.innerHTML = `
      <input type="checkbox" data-id="${esc(lead.id)}" ${selectedIds.has(lead.id) ? 'checked' : ''}/>
      <div class="lead-body">
        <div class="lead-name">${esc(lead.founder) || '(no name found)'}</div>
        <div class="lead-sub">${[lead.company, lead.hq].filter(Boolean).map(esc).join(' · ')}</div>
        ${lead.summary ? `<div class="lead-hint">${esc(lead.summary)}</div>` : ''}
        <div style="display:flex;gap:4px;flex-wrap:wrap">${pills.join('')}</div>
      </div>`;

    const cb = el.querySelector('input[type=checkbox]');
    cb.addEventListener('change', e => {
      if (e.target.checked) selectedIds.add(lead.id);
      else                  selectedIds.delete(lead.id);
      el.className = 'lead-item' + (selectedIds.has(lead.id) ? ' checked' : '');
      updateAddButton();
    });

    listEl.appendChild(el);
  });
}

function updateAddButton() {
  const n   = selectedIds.size;
  const btn = document.getElementById('btn-add');
  btn.textContent = `Add ${n} selected to queue`;
  btn.disabled    = n === 0;
}

// ─────────────────────────────────────────────
// Add selected → queue
// ─────────────────────────────────────────────
document.getElementById('btn-add').addEventListener('click', async () => {
  const toAdd = scrapedLeads.filter(l => selectedIds.has(l.id));
  if (!toAdd.length) return;

  const existing    = await getQueue();
  const knownLinks  = new Set(existing.filter(l => l.linkedin).map(l => l.linkedin));
  const knownIds    = new Set(existing.map(l => l.id));
  const fresh       = toAdd.filter(l =>
    (!l.linkedin || !knownLinks.has(l.linkedin)) && !knownIds.has(l.id)
  );

  await chrome.storage.local.set({ [QUEUE_KEY]: [...fresh, ...existing] });
  await refreshQueueBanner();

  // Reset scan state
  scrapedLeads = [];
  selectedIds  = new Set();
  document.getElementById('lead-list').style.display = 'none';
  document.getElementById('btn-add').style.display   = 'none';
  showEmpty(fresh.length > 0
    ? `✓ ${fresh.length} lead${fresh.length !== 1 ? 's' : ''} added to queue.`
    : 'All selected leads were already in the queue.'
  );
});

// ─────────────────────────────────────────────
// Queue banner
// ─────────────────────────────────────────────
async function refreshQueueBanner() {
  const queue  = await getQueue();
  const banner = document.getElementById('queue-banner');
  const text   = document.getElementById('queue-text');
  const sendBtn = document.getElementById('btn-send');
  const csvBtn  = document.getElementById('btn-csv');

  if (queue.length > 0) {
    banner.classList.remove('hidden');
    text.textContent  = `${queue.length} lead${queue.length !== 1 ? 's' : ''} queued`;
    sendBtn.disabled  = false;
    csvBtn.disabled   = false;
  } else {
    banner.classList.add('hidden');
    sendBtn.disabled  = true;
    csvBtn.disabled   = true;
  }
}

// ─────────────────────────────────────────────
// Download queue as CSV (headers Beacon auto-maps on drop)
// ─────────────────────────────────────────────
document.getElementById('btn-csv').addEventListener('click', async () => {
  const queue = await getQueue();
  if (!queue.length) return;

  const COLS = ['founder', 'company', 'hq', 'sector', 'stage', 'signalType',
                'signalDate', 'leftJobDate', 'summary', 'origin', 'source',
                'sourceUrl', 'linkedin', 'website', 'notes'];
  const quote = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = [
    COLS.join(','),
    ...queue.map(l => COLS.map(c => quote(l[c])).join(','))
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `beacon-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ─────────────────────────────────────────────
// Send to Beacon
// ─────────────────────────────────────────────
document.getElementById('btn-send').addEventListener('click', async () => {
  const queue = await getQueue();
  if (!queue.length) return;

  const { beaconUrl } = await getSettings();

  // Find an open Beacon tab
  const allTabs  = await chrome.tabs.query({});
  let beaconTab  = allTabs.find(t => t.url && isBeaconUrl(t.url, beaconUrl));

  if (!beaconTab) {
    const target = beaconUrl || 'https://coconad.github.io/enzo-beacon/';
    beaconTab = await chrome.tabs.create({ url: target, active: true });
    await delay(2500); // wait for page to fully load
  } else {
    await chrome.tabs.update(beaconTab.id, { active: true });
    await delay(300);
  }

  // Run a function inside the Beacon tab to write leads to localStorage
  let imported = 0;
  try {
    const results = await chrome.scripting.executeScript({
      target : { tabId: beaconTab.id },
      func   : mergeLeadsIntoBeacon,
      args   : [queue]
    });
    imported = results?.[0]?.result ?? 0;
  } catch (e) {
    showEmpty('Could not reach Beacon tab. Make sure Beacon is fully loaded and try again.');
    return;
  }

  // Clear the queue
  await chrome.storage.local.set({ [QUEUE_KEY]: [] });
  await refreshQueueBanner();

  document.getElementById('lead-list').style.display = 'none';
  document.getElementById('btn-add').style.display   = 'none';
  showEmpty(imported > 0
    ? `✓ ${imported} lead${imported !== 1 ? 's' : ''} imported into Beacon.`
    : 'Beacon updated (leads were already present).'
  );
  document.getElementById('footer-hint').textContent = 'Beacon refreshed ✓';
});

// This function is serialised and executed inside the Beacon tab.
// It ONLY touches the beacon.v1 localStorage key.
function mergeLeadsIntoBeacon(leads) {
  const STORE_KEY = 'beacon.v1';
  try {
    const raw   = localStorage.getItem(STORE_KEY);
    const state = raw ? JSON.parse(raw) : {
      records: [],
      weights: { fresh: 30, stage: 35, soeu: 25, signal: 10 },
      digestSize: 10, slackWebhook: '', earliestOnly: true
    };

    const knownLinks = new Set(state.records.filter(r => r.linkedin).map(r => r.linkedin));
    const knownIds   = new Set(state.records.map(r => r.id));

    const fresh = leads.filter(l =>
      (!l.linkedin || !knownLinks.has(l.linkedin)) && !knownIds.has(l.id)
    );

    if (fresh.length) {
      state.records = [...fresh, ...state.records];
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      // Signal Beacon to re-render (Beacon listens for this event)
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORE_KEY, newValue: JSON.stringify(state)
      }));
    }

    return fresh.length;
  } catch (_) {
    return 0;
  }
}

function isBeaconUrl(url, configured) {
  if (configured && url.startsWith(configured)) return true;
  return (
    url.includes('enzo-beacon') ||
    url.includes('beacon.html') ||
    (url.includes('index.html') && !url.includes('linkedin'))
  );
}

// ─────────────────────────────────────────────
// Clear queue
// ─────────────────────────────────────────────
document.getElementById('btn-clear').addEventListener('click', async () => {
  await chrome.storage.local.set({ [QUEUE_KEY]: [] });
  await refreshQueueBanner();
  showEmpty('Queue cleared.');
});

// ─────────────────────────────────────────────
// Open Beacon
// ─────────────────────────────────────────────
document.getElementById('btn-open-beacon').addEventListener('click', async () => {
  const { beaconUrl } = await getSettings();
  chrome.tabs.create({ url: beaconUrl || 'https://coconad.github.io/enzo-beacon/' });
});

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────
document.getElementById('toggle-settings').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.toggle('show');
});
document.getElementById('btn-cancel-settings').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.remove('show');
});
document.getElementById('btn-save-settings').addEventListener('click', async () => {
  const url = document.getElementById('beacon-url').value.trim();
  await chrome.storage.sync.set({ [SETTINGS_KEY]: { beaconUrl: url } });
  document.getElementById('settings-panel').classList.remove('show');
  document.getElementById('footer-hint').textContent = 'URL saved.';
  setTimeout(() => document.getElementById('footer-hint').textContent = '', 2000);
});

async function getSettings() {
  const r = await chrome.storage.sync.get(SETTINGS_KEY);
  return r[SETTINGS_KEY] || { beaconUrl: '' };
}

async function loadSettings() {
  const s = await getSettings();
  document.getElementById('beacon-url').value = s.beaconUrl || '';
}

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────
async function getQueue() {
  const r = await chrome.storage.local.get(QUEUE_KEY);
  return r[QUEUE_KEY] || [];
}

function showEmpty(msg) {
  document.getElementById('empty-msg').innerHTML = msg;
  document.getElementById('empty-msg').style.display = 'block';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );
}
