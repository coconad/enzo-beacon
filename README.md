# Enzo Beacon

> A private founder-sourcing workspace for early-stage VC dealflow — built for European pre-seed investors.

Beacon surfaces founders **before they raise** — scanning pre-fundraise behaviour signals across LinkedIn, GitHub, accelerator cohorts, government grant databases, and stealth feeds. It scores and ranks every signal by freshness, stage fit, Southern European angle, and signal timing, then delivers everything through a venture CRM-style interface.

---

## What it does

- **Discovers** founders from pre-fundraise signals — stealth activity, first hires, hackathon wins, government grants, accelerator cohorts
- **Ranks** signals using a weighted scoring model: freshness × stage fit × SoEU angle × signal strength × signal timing
- **Filters** by signal timing — `pre-product`, `pre-raise`, or `post-raise` — so you see the earliest founders first
- **Organises** pipeline through a searchable inbox and deal-flow Kanban board
- **Generates** lightweight outreach drafts per founder
- **Alerts** via Slack digest on demand (top-N founders, configurable)
- **Reruns** the daily digest on demand to refresh scoring with a single click

---

## Views

| View | Description |
|------|-------------|
| **Daily Digest** | Ranked feed of top founder signals, scored and sorted. Rerun button re-scores on demand. |
| **Inbox** | Searchable archive of all sourced founders and companies |
| **Kanban** | Deal-flow board: New → Researching → Reached out → Meeting → Pass |
| **Outreach** | Draft and copy outreach messages per founder |
| **Settings** | Tune ranking weights, configure Slack, manage signal sources |

---

## Signal sources

Beacon monitors 13 pre-fundraise behaviour signals, split into two tiers:

**Pre-product** — founder is still building, no product yet
- LinkedIn "building something new" — EU/SoEU geography filter, founded <3 months
- Wellfound (AngelList) — stealth companies, EU geography filter
- GitHub trending — EU-based founders, new repos with early traction
- LinkedIn job posts — solo founders posting their first engineering hire
- Twitter/X — "just quit my job to build" or "6 months in" posts from EU founders
- Substack / personal blogs — founders writing about the problem before they have a product

**Pre-raise** — product exists but no round announced
- Hackathon winners — ETH Zurich, HackUPC, Junction Finland, Slush side events
- EIC Accelerator awardees — pre-product EU companies funded before raising VC
- CDTI Neotec grants (Spain) — pre-revenue B2B Spanish founders
- Startup Portugal / Portugal 2030 — PT pre-seed before they raise
- Antler EU cohorts — Madrid, Stockholm, Berlin; cohort drops = pre-raise
- Entrepreneur First cohorts — technical co-founder pairs, very early stage
- poach.vc — highest-signal stealth feed in Europe

Post-raise sources (press, VC portfolio pages, funding announcement feeds) are excluded — they catch founders too late.

---

## Scoring model

```
Score = (freshness × wf + stage_fit × ws + soeu_angle × wg + signal_strength × wq) × timing_multiplier
```

| Factor | Default weight | Notes |
|--------|---------------|-------|
| Freshness | 30 | Exponential decay over 18 days |
| Stage fit | 35 | Stealth/Pre-seed = 1.0, Seed = 0.15, Series A = 0.0 |
| SoEU angle | 25 | Southern Europe = 1.0, other = 0.35 |
| Signal strength | 10 | Career move = 0.95, Stealth exit = 1.0, Funding = 0.65 |
| Timing multiplier | — | pre-product ×1.2, pre-raise ×1.0, post-raise ×0.6 |

All weights are configurable in Settings.

---

## Stack

- **Frontend**: React 19 + Vite
- **Styling**: Custom CSS (no component library)
- **Data**: Browser localStorage — seed dataset in `src/data/seed.js`
- **Scoring**: `src/utils/scoring.js`
- **Alerts**: Slack incoming webhooks (configured in Settings)
- **Deployment**: Vercel (auto-deploys from `main`)
- **Auth**: Private / internal use only

---

## Setup

```bash
git clone https://github.com/coconad/enzo-beacon.git
cd enzo-beacon
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

No environment variables required — Beacon runs entirely in the browser. The optional Slack webhook URL is entered in Settings and stored in localStorage.

---

## Who it's for

Built for [Enzo Ventures](https://enzo.vc) — a Madrid-based pre-seed fund focused on European B2B founders. Internal tool.

---

## Status

Active development — deployed on Vercel, auto-deploys on push to `main`.
