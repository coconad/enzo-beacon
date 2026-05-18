# 🔦 Enzo Beacon

> A private founder-sourcing workspace for early-stage VC dealflow — built for European pre-seed investors.

Enzo Beacon scans public signals to surface new companies and founders, with a focus on Europe, UK, and Ireland — and a bias toward Southern European founders. It ranks results by relevance and freshness, then delivers them through a clean, venture CRM-style interface.

---

## What it does

- **Discovers** new founders and companies from public signals (social, news, job boards, accelerator batches, etc.)
- **Ranks** results by relevance and recency, with a European / Southern European angle
- **Surfaces** direct profile and source links for fast triage
- **Generates** lightweight outreach drafts per founder
- **Delivers** results as a daily digest, searchable inbox, and deal-flow Kanban board
- **Alerts** via Slack when new matches come in

---

## Interface

Enzo Beacon is designed around a clean, venture CRM-style UI with three main views:

| View | Description |
|------|-------------|
| **Daily Digest** | Ranked feed of new founder signals from the last 24h |
| **Inbox** | Searchable archive of all sourced founders and companies |
| **Kanban** | Deal-flow board to move prospects through stages |

---

## Stack

> *(Update this section with your actual stack)*

- **Frontend**: [framework]
- **Backend / Data**: [e.g. Python, Node, n8n, etc.]
- **Sources**: [e.g. LinkedIn, Twitter/X, Crunchbase, YC, etc.]
- **Alerts**: Slack webhooks
- **Auth**: Private / internal use

---

## Setup

```bash
# Clone the repo
git clone https://github.com/coconad/enzo-beacon.git
cd enzo-beacon

# Install dependencies
npm install   # or pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Fill in your API keys and Slack webhook URL

# Run
npm run dev   # or python main.py
```

---

## Configuration

| Variable | Description |
|----------|-------------|
| `SLACK_WEBHOOK_URL` | Incoming webhook for deal alerts |
| `...` | *(add your other env vars here)* |

---

## Who it's for

Built for [Enzo Ventures](https://enzo.vc) — a Madrid-based pre-seed fund focused on European B2B founders. Internal tool, not publicly deployed.

---

## Status

🚧 Active development
