# 🔍 Social Media Analytics (SMA) Portal
### BAI-404 · B.Tech CSE-AI · IGDTUW
**Submitted by:** Ananya Rastogi · Roll No: 01301172022  
**Submitted to:** Dr. Anup Girdhar

---

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Apify](https://img.shields.io/badge/Apify-00B388?style=for-the-badge&logo=apify&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [12 Analytical Modules](#-12-analytical-modules)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Data Collection via Apify](#-data-collection-via-apify)
- [Frontend Portal](#-frontend-portal)
- [Screenshots](#-screenshots)
- [Evaluation Criteria Coverage](#-evaluation-criteria-coverage)

---

## 🌐 Overview

The **Social Media Analytics (SMA) Portal** is a full-stack, AI-powered analytics platform that collects social media data from **X (Twitter)** and **Facebook** via the **Apify** scraping API, stores it in a local SQLite database, and exposes it through **12 analytical modules** — all visualised in a modern React dashboard.

The platform covers the complete pipeline:

```
Data Collection (Apify)
       ↓
Storage (SQLite via SQLAlchemy)
       ↓
Analytics (NLP · ML · Graph · Statistics)
       ↓
Visualisation (React + custom SVG charts)
       ↓
Report Generation
```

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18)                       │
│   Login → Cases → Dashboard → 12 Module Tabs → Charts/KPIs      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / REST (JWT Bearer)
┌──────────────────────────▼──────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                     │
│  /auth  /cases  /apify  /analytics/[module]                      │
│                                                                   │
│  Services:                                                        │
│   sentiment.py · trends.py · network.py · fake_news.py           │
│   segmentation.py · ads.py · influencer.py · competitor.py       │
│   prediction.py · recommendation.py · visualization.py           │
│   monitoring.py · apify_service.py                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ SQLAlchemy ORM
┌──────────────────────────▼──────────────────────────────────────┐
│                     DATABASE (SQLite)                             │
│              users · cases · posts                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ apify-client
┌──────────────────────────▼──────────────────────────────────────┐
│                   APIFY CLOUD SCRAPING                            │
│   apidojo/tweet-scraper · apify/facebook-posts-scraper           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Custom CSS (no UI library) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Database** | SQLite (via SQLAlchemy ORM) |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **NLP** | TextBlob, scikit-learn (TF-IDF, LR) |
| **ML** | scikit-learn (KMeans, LinearRegression, RandomForest) |
| **Graph** | NetworkX |
| **Data** | Apify Cloud Scraping API |
| **Fonts** | Inter + JetBrains Mono (Google Fonts) |

---

## ⚡ 12 Analytical Modules

| # | Module | Algorithm | Endpoint |
|---|--------|-----------|----------|
| 1 | **Sentiment Analysis** | TextBlob polarity scoring | `GET /analytics/sentiment` |
| 2 | **Trending Topics** | Hashtag frequency counter | `GET /analytics/trends` |
| 3 | **Network Analysis** | NetworkX + Eigenvector + Girvan-Newman | `GET /analytics/network` |
| 4 | **Recommendation System** | TF-IDF cosine similarity | `GET /analytics/recommend?index=N` |
| 5 | **Fake News Detection** | TF-IDF + Logistic Regression | `GET /analytics/fake-news` |
| 6 | **User Segmentation** | KMeans + TF-IDF vectors | `GET /analytics/segments?k=3` |
| 7 | **Data Visualization** | SVG charts (bar, donut, sparkline) | `GET /analytics/charts/*` |
| 8 | **Ad Campaign Optimization** | Engagement scoring + rule-based suggestions | `GET /analytics/engagement` |
| 9 | **Influencer Detection** | Eigenvector centrality (NetworkX) | `GET /analytics/influencers` |
| 10 | **Real-Time Monitoring** | Apify streaming + keyword filter | `GET /analytics/competitors` |
| 11 | **Competitor Analysis** | Keyword mention + sentiment aggregation | `GET /analytics/competitors?keywords=` |
| 12 | **Popularity Prediction** | Linear Regression time-series | `GET /analytics/predict?keyword=` |

---

## 📁 Project Structure

```
sma-project/
│
├── backend/                        # FastAPI Backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry, router registration
│   │   ├── config.py               # Settings (APP_NAME, VERSION, SECRET_KEY)
│   │   ├── database.py             # SQLAlchemy engine + session factory
│   │   │
│   │   ├── models/
│   │   │   ├── user.py             # User model (id, username, hashed_password)
│   │   │   ├── case.py             # Case model (id, name, keyword, platform, dataset_id)
│   │   │   └── post.py             # Post model (id, text, username, likes, retweets, case_id)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.py             # /auth/signup, /auth/login (JWT token)
│   │   │   ├── cases.py            # /cases/create
│   │   │   ├── apify.py            # /apify/fetch-by-case
│   │   │   └── analytics.py        # All 12 analytics endpoints
│   │   │
│   │   └── services/
│   │       ├── auth.py             # Password hashing, JWT creation/verification
│   │       ├── deps.py             # get_current_user dependency
│   │       ├── apify_service.py    # Apify dataset fetch + DB save
│   │       ├── sentiment.py        # TextBlob sentiment analysis
│   │       ├── trends.py           # Hashtag extraction + frequency ranking
│   │       ├── network.py          # NetworkX graph build, influencers, connectors
│   │       ├── recommendation.py   # TF-IDF cosine similarity recommender
│   │       ├── fake_news.py        # TF-IDF + LR fake news classifier
│   │       ├── segmentation.py     # KMeans post clustering
│   │       ├── visualization.py    # Chart data generators
│   │       ├── ads.py              # Top posts + optimization suggestions
│   │       ├── influencer.py       # Eigenvector centrality scoring
│   │       ├── competitor.py       # Per-keyword mention + sentiment analysis
│   │       ├── prediction.py       # LinearRegression trend prediction
│   │       └── monitoring.py       # Keyword monitoring utilities
│   │
│   └── requirements.txt
│
├── frontend/                       # React 18 Frontend (Vite)
│   ├── src/
│   │   └── App.jsx                 # Complete single-file React app
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 🚀 Installation & Setup

### Prerequisites

| Requirement | Version |
|------------|---------|
| Python | 3.10 or higher |
| Node.js | 18 or higher |
| npm | 9 or higher |
| Git | Any recent version |

### 1. Clone the Repository

```bash
git clone https://github.com/AnanyaRastogi/sma-portal.git
cd sma-portal
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**`requirements.txt`:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
apify-client==1.7.0
textblob==0.17.1
scikit-learn==1.3.2
networkx==3.2.1
numpy==1.26.2
python-dotenv==1.0.0
```

```bash
# Download TextBlob corpora (first time only)
python -m textblob.download_corpora
```

### 3. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./sma.db
APP_NAME=Social Media Analytics API
VERSION=1.0.0
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## ▶ Running the Application

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`  
Interactive docs (Swagger UI): `http://localhost:8000/docs`

### Start Frontend

```bash
cd frontend
npm run dev
```

The portal will be available at: `http://localhost:5173`

### Enable CORS (Important)

Add to `backend/app/main.py` if not already present:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📡 API Documentation

All endpoints (except signup/login) require JWT Bearer authentication.

### Authentication

```http
POST /auth/signup?username=analyst&password=secret123
POST /auth/login?username=analyst&password=secret123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Case Management

```http
POST /cases/create?name=Tesla Analysis&keyword=tesla&platform=X&dataset_id=abc123
```

### Data Ingestion

```http
POST /apify/fetch-by-case?case_id=1
```

### Analytics Endpoints

```http
GET  /analytics/sentiment          # TextBlob sentiment + summary
GET  /analytics/trends             # Top hashtags by frequency
GET  /analytics/network            # Graph nodes/edges/influencers/connectors
GET  /analytics/recommend?index=0  # Similar post recommendations
GET  /analytics/fake-news          # Suspicious vs Likely Real classification
GET  /analytics/segments?k=3       # K-Means post clusters
GET  /analytics/engagement         # Top posts + suggestions
GET  /analytics/influencers        # Eigenvector centrality ranking
GET  /analytics/competitors?keywords=tesla,ford,byd
GET  /analytics/predict?keyword=tesla
GET  /analytics/debug-posts        # Post count + sample
DELETE /analytics/clean            # Remove short/invalid posts
```

---

## 🕷 Data Collection via Apify

### Step 1: Create an Apify Account
Visit [apify.com](https://apify.com) and register for a free account.

### Step 2: Get Your API Token
Go to **Settings → Integrations** and copy your API token.

### Step 3: Run a Scraper

**For X (Twitter):**
- Actor: `apidojo/tweet-scraper`
- Input: `{ "searchTerms": ["#Tesla"], "maxItems": 100, "queryType": "Latest" }`

**For Facebook:**
- Actor: `apify/facebook-posts-scraper`
- Input: `{ "startUrls": [{ "url": "https://www.facebook.com/Tesla" }], "resultsLimit": 50 }`

### Step 4: Get Dataset ID
After the run completes → **Storage** → **Datasets** → copy the dataset ID (e.g. `abc123xyz`)

### Step 5: Create Case + Fetch
1. Open the portal → **Cases**
2. Fill in: Case Name, Keyword, Platform, Dataset ID
3. Click **Create Case** → note the Case ID
4. Enter Case ID in the Fetch section → Click **Fetch Posts**

The posts are now stored in SQLite and all analytics modules will use them.

---

## 🖥 Frontend Portal

The entire frontend is a **single JSX file** (`App.jsx`) built with React 18 + Vite.

### Key Design Decisions

- **No external UI library** — all components hand-coded with inline CSS
- **Custom SVG charts** — Donut chart, horizontal bar, sparkline
- **JWT stored in localStorage** — auto-attached to all API requests
- **Responsive sidebar navigation** — 12 module tabs
- **Green-on-dark theme** — `#00e676` accent on `#030303` background

### Replacing the App.jsx

```bash
# In a fresh Vite React project:
npm create vite@latest sma-frontend -- --template react
cd sma-frontend
# Replace src/App.jsx with the provided App.jsx
npm run dev
```

---

## 📸 Screenshots

| Screen | Description |
|--------|-------------|
| Login | JWT authentication, register/login tabs |
| Overview | KPI cards, recent posts sample, module grid |
| Cases | Create case form + Apify fetch panel |
| Sentiment | Donut chart + bar chart + classified post list |
| Trends | KPIs + horizontal bar + hashtag cloud |
| Network | Nodes/edges count + influencer ranking with score bars |
| Fake News | Pie chart + suspicious/real labelled posts |
| Segments | K selector + colour-coded cluster cards |
| Ads & CTR | Top posts by engagement + optimization tips |
| Influencers | Medal-ranked list with centrality progress bars |
| Competitors | Per-brand metric grid + sentiment breakdown |
| Prediction | Sparkline (history) + Sparkline (forecast) + period grid |
| Recommend | Query post + cosine-similar results |

---

## ✅ Evaluation Criteria Coverage

| Criteria | Weight | Implementation |
|----------|--------|----------------|
| **Implementation (All 12 Modules)** | 30% | All 12 modules implemented with real backend logic |
| **Frontend + Dashboard** | 15% | React SPA with charts, KPIs, filters on every page |
| **Data Collection (API usage)** | 10% | Apify integration — Twitter + Facebook scraping |
| **ML Models & Accuracy** | 10% | TextBlob, LR (fake news), KMeans, LinearRegression, TF-IDF |
| **Visualization** | 10% | Custom SVG donut, horizontal bar, sparkline charts |
| **Report Quality** | 15% | Detailed Word/PDF report included |
| **Innovation / Extra Features** | 10% | JWT auth, case management, competitor comparison, sparkline forecasts |

---

## 📦 Final Deliverables

- [x] Source Code (this repository)
- [x] Running Application (local: FastAPI + React)
- [x] Dataset via Apify API links
- [x] Final Report (PDF format)
- [x] README (this file)
- [ ] Demo Video *(optional)*

---

## 📄 License

This project is submitted as academic coursework for **BAI-404 Social Media Analytics** at **Indira Gandhi Delhi Technical University for Women (IGDTUW)**.

---

<div align="center">
  Made with ❤️ by <strong>Ananya Rastogi</strong> · 01301172022 · IGDTUW
</div>