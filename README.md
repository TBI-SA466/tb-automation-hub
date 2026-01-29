# tb-automation-hub

A lightweight “automation hub” repo that integrates **Jira**, **GitHub**, **Figma**, **Confluence**, and **QA automation** into repeatable pipelines.

This is intentionally framework-light: plain Node (ESM) scripts using `fetch`, env vars, and markdown report outputs.

## What this repo does (in one sentence)

Turns scattered manual workflows (pull data, compare, validate, summarize, publish) into **scheduled + on-demand pipelines** that output **auditable reports** and optionally **create/update tickets/pages**.

## Why this exists (problems it solves)

- **Too much manual effort**: teams repeatedly copy/paste metrics, screenshots, acceptance criteria, and status updates.
- **No single source of truth**: Jira, GitHub, Figma, and Confluence drift apart (states/ACs/tokens change).
- **Slow triage**: when something breaks, it’s hard to answer “what changed?”, “who owns it?”, “what evidence do we have?”
- **Inconsistent QA**: validation steps vary by person; results aren’t reproducible.

## Benefits

- **Repeatability**: the same inputs always produce the same reports and checks.
- **Traceability**: link “design → ticket → code → validation run” with evidence.
- **Faster debugging**: failures can include structured context (story IDs, screenshots, API payloads).
- **Less coordination tax**: auto-publish summaries to Confluence, and/or auto-create Jira follow-ups.
- **Safer releases**: turn “tribal knowledge” checks into automated gates.

## What you can build here

- **Jira metrics**: velocity, cycle time, SLA, blocked time, trend reports
- **Design drift detection**: Figma ↔ Storybook ↔ code tokens
- **QA automation**: regression packs (Playwright), accessibility checks, evidence bundles
- **Confluence publishing**: dashboards + report attachments
- **GitHub automation**: PR/Issue automation (comments, labels, issue creation)

## How it works (architecture)

- **Connectors** (`src/connectors/*`): small wrappers around each system’s API (Jira/GitHub/Figma/Confluence)
- **Pipelines** (`src/pipelines/*`): business logic for a workflow (pull → compute/diff → report)
- **Reports** (`src/report/*` + `reports/`): writes markdown output that CI can archive or publish
- **Runner** (`scripts/run-all.mjs`): runs one pipeline or all pipelines
- **CI** (`.github/workflows/automation.yml`): scheduled runs + manual “Run workflow” button; uploads `reports/` artifacts

## What’s included today (starter pipelines)

This repo is scaffolded with two starter pipelines so you can extend from a working baseline:

- **`jira-velocity`**: pulls issues using a JQL query and writes a simple “issue type breakdown” report  
  - Output: `reports/jira.velocity.md`
- **`design-drift`**: fetches a Figma file snapshot and writes a starter report (placeholder for deeper diffs)  
  - Output: `reports/figma.design-drift.md`

## Typical expansions (recommended)

- **Jira ↔ GitHub**: auto-transition Jira tickets when PRs merge; enforce ticket links in PRs.
- **Figma ↔ Storybook**: list expected variant/state coverage from Figma and compare to Storybook stories.
- **Confluence dashboards**: publish the markdown reports into a living page (weekly exec summary, QA dashboard).
- **QA regression**: run Playwright against deployed Storybook/apps and attach screenshots/traces to Jira bugs.

## Setup

Copy `config/example.env` to `.env` and fill credentials.

```bash
cp config/example.env .env
```

### Credentials model (recommended)

- **Local runs**: use `.env` (never commit it)
- **GitHub Actions**: set secrets in repo settings (Jira/Figma/Confluence tokens, optional GitHub token)

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

If a pipeline fails, the workflow still uploads any partial reports to help debugging.

## What “good” looks like (operating model)

- **Daily/weekly scheduled runs** keep dashboards fresh.
- **Manual runs** support ad-hoc audits (e.g., “what drifted after yesterday’s release?”).
- **Artifacts are evidence**: reports/screenshots/traces become your reproducible QA record.



