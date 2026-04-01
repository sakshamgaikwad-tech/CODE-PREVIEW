from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from models.schemas import CodeReviewRequest, CodeReviewResponse
from services.llm_service import analyze_code

app = FastAPI(
    title="CODE-PREVIEW API",
    description="AI-powered code review using Google Gemini",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend (any origin during dev) to call the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "CODE-PREVIEW API is running 🚀"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "timestamp": int(time.time())}


@app.post("/api/review", response_model=CodeReviewResponse, tags=["Review"])
async def review_code(request: CodeReviewRequest):
    """
    Submit code for an AI-powered review.

    - **code**: The source code to review (max 50,000 chars)
    - **language**: Programming language (default: "auto" for auto-detection)
    - **context**: Optional extra context about the code
    """
    try:
        result = await analyze_code(
            code=request.code,
            language=request.language,
            context=request.context,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Review failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ---------------------------------------------------------------------------
# Entry point (for running directly: python main.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
