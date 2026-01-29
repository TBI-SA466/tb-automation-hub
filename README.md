# tb-automation-hub

A lightweight “automation hub” repo for integrating **Jira**, **GitHub**, **Figma**, **Confluence**, and **QA automation** into repeatable pipelines.

This is intentionally framework-light: plain Node (ESM) scripts using `fetch`, env vars, and markdown report outputs.

## What you can build here

- Jira metrics (velocity, cycle time, SLA, blocked time)
- Design drift detection (Figma ↔ Storybook ↔ code tokens)
- QA regression packs (Playwright runs + evidence packs)
- Publishing to Confluence (dashboards + attachments)
- GitHub PR/Issue automation (comments, labels, issue creation)

## Setup

Copy `config/example.env` to `.env` and fill credentials.

```bash
cp config/example.env .env
```

## Run

Run all pipelines:

```bash
node ./scripts/run-all.mjs
```

Run a single pipeline:

```bash
node ./scripts/run-all.mjs --pipeline=jira-velocity
```

## Reports

Reports are written to `reports/` (markdown). CI uploads them as artifacts.


