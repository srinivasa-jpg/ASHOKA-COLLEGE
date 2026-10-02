# Smart Notes AI

A beginner-friendly study-notes summarizer for Ashoka students.

## V2 features
- Paste notes in a web interface
- Upload PDF or TXT notes (up to 10 MB)
- Generate a concise extractive summary
- Show key points
- FastAPI backend + built-in frontend
- No API key required

## Run locally

```bash
cd "Ashoka Students/smart-notes-ai/backend"
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`.

API documentation is available at `http://127.0.0.1:8000/docs`.

## Project structure

```text
smart-notes-ai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── static/
│   │       ├── index.html
│   │       └── style.css
│   └── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Next milestone
Add optional LLM-powered summaries, flashcards, quizzes, and question-answering over uploaded notes.
