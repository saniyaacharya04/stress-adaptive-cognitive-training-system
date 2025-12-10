# Stress-Adaptive Cognitive Training System (SACTS)

SACTS is a research-grade platform for running adaptive cognitive experiments with real-time stress measurement.
It combines multimodal data capture, physiological stress inference, and adaptive task difficulty using real-time feedback loops.

This repository implements a complete end-to-end system including:

* Frontend (React + Vite + TypeScript + Tailwind + shadcn/ui)
* Backend (Flask + Socket.IO + SQLAlchemy)
* Live cognitive tasks (N-back, Stroop, Reaction Time)
* Participant and session management
* Data export, logging, and baseline analytics
* Modular architecture for machine learning and adaptive engines

---

## 1. Features

### Core Platform

* Participant onboarding and identifier assignment
* JWT-based session authentication
* Research-grade task timing (millisecond precision)
* Automatic data logging for every trial
* End-to-end separation of participant and admin interfaces
* SQLite local development database (PostgreSQL compatible)

### Stress and Adaptation (Phase 2 and 3)

* Real-time stress data streaming via WebSockets
* RR-interval (PPG/HRV) ingestion API
* ML pipeline for adaptive stress inference
* PID controller for difficulty tuning
* A/B testing framework for adaptive algorithms
* Supervisor task orchestrator

### Admin Tools

* Live monitoring room
* Training session timeline visualization
* Log browser for experiment audit
* Admin authentication and settings panel

---

## 2. Project Structure

```
stress-adaptive-cognitive-training-system/
│
├── backend/
│   ├── app.py
│   ├── app.db
│   ├── requirements.txt
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── utils/
│   └── static/
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── styles/
│   └── public/
│
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
│
├── tools/
│   ├── stress_model_training.ipynb
│   └── data_preprocessing.py
│
└── README.md
```

---

## 3. Requirements

### Backend

* Python 3.11+
* pip or conda
* SQLite (default) or PostgreSQL
* eventlet for WebSocket concurrency

### Frontend

* Node.js 18+
* npm or bun

---

## 4. Setup Instructions

### 4.1 Create environment

```
conda create -n stresssys python=3.11
conda activate stresssys
```

### 4.2 Install backend

```
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on:

```
http://localhost:5000
```

Verify:

```
curl http://localhost:5000/healthz
```

### 4.3 Install frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:8080
```

---

## 5. Key API Endpoints

### POST /api/register

Registers a new participant and assigns a participant ID.

### POST /api/session

Creates a session and issues a session token.

### WebSocket `/ws/stress`

Used for live RR-interval and stress inference streaming.

---

## 6. Running in Production (Docker)

From the project root:

```
docker compose -f docker/docker-compose.yml up --build
```

This launches:

* Backend (Gunicorn + Eventlet)
* Frontend (Nginx static server)
* Optional GPU inference container

---

## 7. Development Notes

### Auto-generated participant ID

Backend assigns IDs using timestamp-safe hashing.

### Cross-Origin Configuration

CORS policy allows `localhost:8080` during development and strict origins in production.

### Real-time Precision

Eventlet WebSockets are used for low-latency (<10 ms) bi-directional streaming.

### Database Migration

SQLite is used for development. The models are portable to PostgreSQL without modification.

---

## 8. Future Extensions

Planned modules for extended research studies:

* Deep learning affect inference (CNN + LSTM)
* Eye-tracking via WebRTC landmarks
* Personalized stress-response calibration
* EEG integration pipeline
* Multi-participant synchronized trials

---

## 9. License

This project is released for research and academic usage.
Commercial use requires permission from the authors.

---

## 10. Contact

For implementation details, research collaboration, or deployment guidance, contact the system maintainer.
