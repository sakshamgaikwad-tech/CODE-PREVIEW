# CODE-PREVIEW — AI Code Review

Paste any code snippet and receive an instant, structured AI review powered by **Google Gemini 1.5 Flash**.

```
CODE-PREVIEW/
├── backend/
│   ├── main.py                  ← FastAPI app (entry point)
│   ├── requirements.txt
│   ├── .env                     ← your GEMINI_API_KEY goes here
│   ├── .env.example
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   └── services/
│       ├── __init__.py
│       └── llm_service.py
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 1. Backend setup

```bash
# From the backend/ directory
cd backend

# Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key to .env
# (edit .env and replace  your_gemini_api_key_here)

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at → **http://localhost:8000**
Interactive docs at → **http://localhost:8000/docs**

---

## 2. Frontend

Just open `frontend/index.html` in your browser — no build step needed.

> Make sure the backend is running on port **8000** before clicking **Review Code**.

---

## API

### `POST /api/review`

```json
{
  "code": "def foo(): pass",
  "language": "python",
  "context": "Optional description"
}
```

Returns a `CodeReviewResponse` with:

| Field | Type | Description |
|---|---|---|
| `language_detected` | string | Detected language |
| `score` | int 0–100 | Code quality score |
| `summary` | string | 2–3 sentence summary |
| `positive_aspects` | string[] | What's good |
| `bugs` | Bug[] | Issues with severity + fixes |
| `suggestions` | Suggestion[] | Improvements |
| `review_time_ms` | int | Time taken |

---

## Get a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a key
3. Paste it in `backend/.env`
