# Social Media Analytics (SMA)

A lightweight analytics platform for collecting, processing, and reporting social media data. This repository contains a Python backend, a Vite + React frontend, and worker scripts for background jobs and integrations.

## Table of Contents
- About
- Features
- Repository Structure
- Technologies
- Prerequisites
- Setup
	- Backend
	- Frontend
	- Workers
- Configuration
- Database
- Running the App (development)
- API routes overview
- Reporting
- Contributing
- License

## About

SMA ingests social media posts and related metadata, runs analytics (sentiment, trends, recommendations, segmentation, prediction), and exposes APIs and reports for visualization and export.

This project is intended as a starter platform for research, demos, and lightweight production prototypes.

## Features

- Ingest and store posts, users, and cases
- Analytics services: sentiment, trends, influence, recommendation
- Background workers for integrations and scheduling
- Simple HTML/PDF report generation
- Frontend portal (Vite + React) for dashboards and interaction

## Repository Structure

- `backend/` — Python backend and API server
	- `run.py` — backend entrypoint
	- `app/` — application package
		- `config.py` — configuration
		- `database.py` — DB helpers
		- `main.py` — app factory / server wiring
		- `models/` — domain models (`case.py`, `post.py`, `user.py`)
		- `routes/` — API route modules (analytics, apify, auth, cases, reports)
		- `services/` — business logic and third-party integrations
		- `utils/` — helpers and auth utilities
- `sma-frontend/` — Vite + React frontend
- `workers/` — background worker scripts (apify_worker.py, scheduler.py)
- `database/` — SQLite database file (`db.sqlite3`)
- `reports/` — report generation utilities (HTML, PDF)

## Technologies

- Python 3.10+
- Flask (or a lightweight ASGI/WSGI app) for the backend
- SQLite for local development database
- Node.js + Vite + React for frontend

## Prerequisites

- Python 3.10 or newer
- Node.js 18+ and npm or yarn
- (Optional) virtual environment tooling: `venv`, `pipenv`, or `venv` + `pip`

## Setup

Follow these steps to set up the project locally.

### Backend

1. Create and activate a virtual environment:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Inspect configuration in [backend/app/config.py](backend/app/config.py).

4. Start the backend server (development):

```bash
cd backend
python run.py
```

> By default the app uses the local SQLite database at `database/db.sqlite3`.

### Frontend

1. Change to the frontend folder and install dependencies:

```bash
cd sma-frontend
npm install
```

2. Run the dev server:

```bash
npm run dev
```

The frontend dev server (Vite) will print a localhost URL (usually `http://localhost:5173`). The frontend consumes the backend API endpoints under the backend server host — update the frontend config if needed.

### Workers

Worker scripts live in the `workers/` folder. To run them manually:

```bash
python workers/apify_worker.py
python workers/scheduler.py
```

Run them in separate terminals or use a process manager (supervisord, systemd, or PM2 for node-based workers).

## Configuration

- Primary backend configuration is in [backend/app/config.py](backend/app/config.py).
- For local dev, environment variables may be used — e.g. `DATABASE_URL`, `API_KEYS`, or any custom settings defined in `config.py`.

Create a `.env` (or set system env vars) if your environment requires secrets or API keys. The codebase reads configuration from `config.py`; search that file for exact variable names.

## Database

- A SQLite DB file is included at `database/db.sqlite3` for development convenience.
- To reset the local DB, stop the app and remove `database/db.sqlite3` (or move it) and restart the backend to reinitialize as the project’s code supports.

## Running the App (development)

Typical development workflow (two terminals):

Terminal 1 — backend:

```bash
cd backend
python run.py
```

Terminal 2 — frontend:

```bash
cd sma-frontend
npm run dev
```

Optional Terminal 3 — workers:

```bash
python workers/apify_worker.py
```

## API routes overview

Key route modules are in [backend/app/routes](backend/app/routes):

- `analytics.py` — endpoints for analytics queries and summaries
- `apify.py` — endpoints or hooks used by Apify integrations
- `auth.py` — authentication endpoints
- `cases.py` — case management endpoints
- `reports.py` — endpoints to generate or fetch reports

Open these files for exact HTTP routes and payload shapes.

## Reporting

Report generation utilities are in the `reports/` folder:
- `generate_html.py` — HTML report templates and generation logic
- `generate_pdf.py` — PDF export utilities

Use the API endpoints in `reports.py` to trigger report generation or call the scripts directly for offline report runs.

## Contributing

1. Fork the repository and create a feature branch.
2. Add tests for new behavior (if applicable).
3. Open a pull request with a clear description of changes.

Please follow the existing code style and add minimal, focused changes per PR.

## Troubleshooting

- If the frontend cannot reach the backend, check CORS or the API base URL in the frontend environment configuration.
- If the DB file is locked, ensure no other process is holding it and restart the backend.


Last updated: April 28, 2026

