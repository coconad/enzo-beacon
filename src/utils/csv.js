// CSV import for Sales Navigator scraper exports.
// Parses RFC-4180-style CSV and auto-maps common scraper column names
// (Evaboot, Phantombuster, our own extension, etc.) onto Beacon records.

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Column synonyms, all compared lowercase with spaces/underscores stripped.
const COLUMNS = {
  founder:    ['founder', 'name', 'fullname', 'lead', 'person', 'contact', 'leadname'],
  firstName:  ['firstname', 'first'],
  lastName:   ['lastname', 'last', 'surname'],
  company:    ['company', 'companyname', 'account', 'accountname', 'organisation', 'organization', 'startup'],
  hq:         ['hq', 'hqcity', 'location', 'city', 'geo', 'region', 'leadlocation'],
  sector:     ['sector', 'industry', 'vertical', 'category'],
  stage:      ['stage'],
  signalType: ['signaltype', 'signal'],
  signalDate: ['signaldate', 'date', 'founddate', 'scrapedate'],
  leftJobDate:['leftjobdate', 'leftlastjob', 'jobenddate', 'enddate'],
  summary:    ['summary', 'headline', 'title', 'jobtitle', 'description', 'about', 'note'],
  origin:     ['origin', 'nationality', 'founderorigin'],
  linkedin:   ['linkedin', 'linkedinurl', 'profileurl', 'linkedinprofileurl', 'profilelink', 'salesnavurl', 'url'],
  website:    ['website', 'companywebsite', 'companyurl', 'domain', 'site'],
  source:     ['source', 'sourcename'],
  sourceUrl:  ['sourceurl', 'sourcelink'],
  notes:      ['notes', 'comments', 'remarks'],
};

const SOEU_TERMS = [
  'italy', 'milan', 'rome', 'turin', 'naples', 'florence', 'bologna', 'venice', 'genoa',
  'spain', 'barcelona', 'madrid', 'valencia', 'seville', 'bilbao', 'malaga', 'zaragoza',
  'portugal', 'lisbon', 'porto', 'braga', 'coimbra',
  'greece', 'athens', 'thessaloniki',
  'italian', 'spanish', 'portuguese', 'greek',
];

function inferSoEU(text) {
  const lower = text.toLowerCase();
  return SOEU_TERMS.some(t => lower.includes(t));
}

function normaliseHeader(h) {
  return h.toLowerCase().replace(/[\s_-]+/g, '').trim();
}

function buildHeaderIndex(headerRow) {
  const index = {};
  headerRow.forEach((raw, i) => {
    const norm = normaliseHeader(raw);
    for (const [key, synonyms] of Object.entries(COLUMNS)) {
      if (index[key] === undefined && synonyms.includes(norm)) {
        index[key] = i;
        return;
      }
    }
  });
  return index;
}

const STAGES = ['Stealth', 'Pre-seed', 'Seed', 'Seed extension', 'Series A'];
const SIGNALS = ['Funding', 'Launch', 'Career move', 'Stealth exit', 'Accelerator'];

function matchEnum(value, options, fallback) {
  if (!value) return fallback;
  const norm = value.toLowerCase().trim();
  return options.find(o => o.toLowerCase() === norm) || fallback;
}

function toISODate(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
}

// Returns { records, skipped } — skipped counts rows with no usable name.
export function csvToRecords(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return { records: [], skipped: 0 };

  const idx = buildHeaderIndex(rows[0]);
  const get = (row, key) => (idx[key] !== undefined ? (row[idx[key]] || '').trim() : '');
  const today = new Date().toISOString().slice(0, 10);

  const records = [];
  let skipped = 0;

  rows.slice(1).forEach((row, i) => {
    let founder = get(row, 'founder');
    if (!founder) {
      founder = [get(row, 'firstName'), get(row, 'lastName')].filter(Boolean).join(' ');
    }
    if (!founder) { skipped++; return; }

    const hq = get(row, 'hq');
    const origin = get(row, 'origin');
    const summary = get(row, 'summary');

    records.push({
      id: 'csv_' + Date.now() + '_' + i,
      founder,
      company: get(row, 'company'),
      hq,
      sector: get(row, 'sector'),
      stage: matchEnum(get(row, 'stage'), STAGES, 'Stealth'),
      signalType: matchEnum(get(row, 'signalType'), SIGNALS, 'Career move'),
      signalDate: toISODate(get(row, 'signalDate')) || today,
      leftJobDate: toISODate(get(row, 'leftJobDate')),
      summary: summary || [founder, get(row, 'company')].filter(Boolean).join(' — '),
      origin,
      soeu: inferSoEU([hq, origin, founder].join(' ')),
      source: get(row, 'source') || 'Sales Navigator CSV',
      sourceUrl: get(row, 'sourceUrl') || get(row, 'linkedin'),
      linkedin: get(row, 'linkedin'),
      website: get(row, 'website'),
      status: 'New',
      notes: get(row, 'notes'),
    });
  });

  return { records, skipped };
}
