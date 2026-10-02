from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import re

app = FastAPI(title="Smart Notes AI", version="0.1.0")


class NotesRequest(BaseModel):
    text: str = Field(min_length=20, description="Study notes to summarize")


class SummaryResponse(BaseModel):
    summary: str
    key_points: list[str]


def split_sentences(text: str) -> list[str]:
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", text.strip())
        if sentence.strip()
    ]


def summarize_notes(text: str) -> SummaryResponse:
    sentences = split_sentences(text)
    if not sentences:
        raise ValueError("No readable sentences found.")

    # V1 uses a lightweight extractive approach so the project works
    # without API keys. This can later be replaced by an LLM service.
    summary_sentences = sentences[: min(3, len(sentences))]
    key_points = sentences[: min(5, len(sentences))]

    return SummaryResponse(
        summary=" ".join(summary_sentences),
        key_points=key_points,
    )


@app.get("/")
def root():
    return {"message": "Smart Notes AI API is running"}


@app.post("/summarize", response_model=SummaryResponse)
def summarize(request: NotesRequest):
    try:
        return summarize_notes(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
