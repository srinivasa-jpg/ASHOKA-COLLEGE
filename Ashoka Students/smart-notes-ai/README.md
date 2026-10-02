# Smart Notes AI

A beginner-friendly AI project for Ashoka students that summarizes study notes.

## Features
- Paste study notes
- Generate a concise summary
- Extract key points
- Simple FastAPI backend
- Ready to extend with PDF upload, flashcards, quizzes, and an LLM API

## Run locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs and try POST /summarize.

## Next steps
1. Connect an LLM API for higher-quality summaries.
2. Add PDF/text-file upload.
3. Add a Next.js frontend.
4. Add flashcards and quiz generation.
