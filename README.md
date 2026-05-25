# AI Lending Dashboard

An interactive underwriting workbench for loan applications, built as a React/Babel dashboard shell that loads JSX components directly in the browser. The project combines applicant data, credit bureau insights, property details, and scorecard analytics into a single workflow for underwriting review and decision support.

## Description

This project models a loan underwriting experience with:
- applicant profile and identity review
- credit and bureau history scoring
- income, repayment capacity, and cashflow insights
- property, collateral, and legal evaluation
- scorecard drill-down visualizations and decision snapshots
- automated report generation and browser-based verification tests

It is structured to keep the UI shell separate from reusable JSX components, while using Playwright for end-to-end verification of the rendered dashboard.

## Structure

- `public/` — HTML entry point for the underwriting workbench
- `src/components/` — JSX components used by the dashboard
- `tests/` — Playwright test and verification scripts
- `scripts/` — auxiliary scripts such as report generation
- `data/` — sample data and uploads used by the app
- `assets/screenshots/` — generated UI screenshot assets
- `docs/` — PDF and documentation assets
- `archive/` — archived project bundle(s)

## Usage

1. Open `public/Underwriting Workbench.html` in a browser.
2. The app loads Babel and JSX components from `src/components/`.
3. Run tests from the root using Playwright scripts in `tests/`.

## Git

The repository is initialized with a `.gitignore` to exclude dependencies and editor settings.
