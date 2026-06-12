// content.js — injected into linkedin.com/sales/* pages
// Reads visible DOM to extract lead data. Never sends data anywhere — only
// responds to a message from the popup asking it to scrape.

// ---- helpers ----

function getTextFrom(root, selectors) {
  for (const sel of selectors) {
    try {
      const el = root.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text) return text;
    } catch (_) {}
  }
  return '';
}

function inferSoEU(text) {
  const terms = [
    'italy','milan','rome','turin','naples','florence','bologna','venice','genoa',
    'spain','barcelona','madrid','valencia','seville','bilbao','malaga','zaragoza',
    'portugal','lisbon','porto','braga','coimbra',
    'greece','athens','thessaloniki',
    'italian','spanish','portuguese','greek'
  ];
  const lower = text.toLowerCase();
  return terms.some(t => lower.includes(t));
}

function uid(i) {
  return 'sn_' + Date.now() + (i != null ? '_' + i : '');
}

// Find when the person left their last job by scanning visible experience
// date ranges like "Jan 2024 – Mar 2026" / "Jan 2024 - Present". If any range
// is still "Present" they haven't left; otherwise take the latest end date.
function findLeftJobDate() {
  const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const rangeRe = /([A-Za-z]{3})[a-z]*\.?\s+(\d{4})\s*[–—-]\s*(Present|present|([A-Za-z]{3})[a-z]*\.?\s+(\d{4}))/g;

  const text = document.body.innerText || '';
  let latestEnd = null;
  let match;
  while ((match = rangeRe.exec(text)) !== null) {
    if (/present/i.test(match[3])) return ''; // still employed somewhere
    const mon = MONTHS[match[4].slice(0, 3).toLowerCase()];
    const year = parseInt(match[5], 10);
    if (mon === undefined || !year) continue;
    // End of that month = approximate leave date
    const end = new Date(year, mon + 1, 0);
    if (!latestEnd || end > latestEnd) latestEnd = end;
  }

  if (!latestEnd || latestEnd > new Date()) return '';
  return latestEnd.toISOString().slice(0, 10);
}

// ---- profile page (/sales/lead/…) ----

function scrapeProfilePage() {
  const name = getTextFrom(document, [
    '[data-anonymize="person-name"]',
    '.artdeco-entity-lockup__title span[aria-hidden="true"]',
    '.artdeco-entity-lockup__title span',
    'h1'
  ]);
  if (!name) return [];

  const headline = getTextFrom(document, [
    '[data-anonymize="headline"]',
    '.artdeco-entity-lockup__subtitle span[aria-hidden="true"]',
    '.artdeco-entity-lockup__subtitle'
  ]);

  const company = getTextFrom(document, [
    '[data-anonymize="company-name"]',
    'a[data-control-name="view_company"] span[aria-hidden="true"]',
    'a[data-control-name="view_company"]'
  ]);

  const location = getTextFrom(document, [
    '[data-anonymize="location"]',
    '.artdeco-entity-lockup__caption span[aria-hidden="true"]',
    '.artdeco-entity-lockup__caption'
  ]);

  const leftJobDate = findLeftJobDate();

  const summary = [name, headline, company ? 'at ' + company : '']
    .filter(Boolean).join(' — ');

  return [{
    id: uid(),
    founder: name,
    company: company,
    hq: location,
    sector: '',
    stage: 'Stealth',
    signalType: 'Career move',
    signalDate: new Date().toISOString().slice(0, 10),
    leftJobDate,
    summary,
    origin: '',
    soeu: inferSoEU(location + ' ' + name),
    source: 'LinkedIn Sales Navigator',
    sourceUrl: window.location.href,
    linkedin: window.location.href,
    website: '',
    status: 'New',
    notes: ''
  }];
}

// ---- search results page (/sales/search/people) ----

function scrapeSearchResults() {
  const leads = [];

  // LinkedIn uses dynamic class names; these are the most stable hooks
  const items = document.querySelectorAll([
    '[data-view-name="search-results-lead-card"]',
    '.search-results__result-container',
    '.artdeco-list__item'
  ].join(', '));

  items.forEach((item, i) => {
    const name = getTextFrom(item, [
      '[data-anonymize="person-name"]',
      '.artdeco-entity-lockup__title a span[aria-hidden="true"]',
      '.artdeco-entity-lockup__title a',
      'a[href*="/sales/lead/"] span[aria-hidden="true"]',
      'a[href*="/sales/lead/"]'
    ]);
    if (!name) return;

    const headline = getTextFrom(item, [
      '[data-anonymize="headline"]',
      '.artdeco-entity-lockup__subtitle span[aria-hidden="true"]',
      '.artdeco-entity-lockup__subtitle'
    ]);

    const company = getTextFrom(item, [
      '[data-anonymize="company-name"]',
      '.artdeco-entity-lockup__caption span[aria-hidden="true"]',
      '.artdeco-entity-lockup__caption'
    ]);

    const location = getTextFrom(item, [
      '[data-anonymize="location"]',
      '.artdeco-entity-lockup__metadata span[aria-hidden="true"]',
      '.artdeco-entity-lockup__metadata'
    ]);

    const linkedinHref =
      item.querySelector('a[href*="/sales/lead/"]')?.href || '';

    const summary = [name, headline, company ? 'at ' + company : '']
      .filter(Boolean).join(' — ');

    leads.push({
      id: uid(i),
      founder: name,
      company: company,
      hq: location,
      sector: '',
      stage: 'Stealth',
      signalType: 'Career move',
      signalDate: new Date().toISOString().slice(0, 10),
      leftJobDate: '', // only inferable on the full profile page
      summary,
      origin: '',
      soeu: inferSoEU(location + ' ' + name),
      source: 'LinkedIn Sales Navigator',
      sourceUrl: linkedinHref || window.location.href,
      linkedin: linkedinHref,
      website: '',
      status: 'New',
      notes: ''
    });
  });

  return leads;
}

// ---- message listener ----

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'scrape') {
    const url = window.location.href;
    let leads = [];

    if (url.includes('/sales/lead/') || url.includes('/sales/people/')) {
      leads = scrapeProfilePage();
    } else if (url.includes('/sales/search/')) {
      leads = scrapeSearchResults();
    }

    sendResponse({ leads, url });
  }
  return true; // keep message channel open for async
});
