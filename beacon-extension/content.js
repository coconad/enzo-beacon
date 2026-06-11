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
