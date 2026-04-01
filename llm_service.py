import google.generativeai as genai
import json
import os
import time
import re
from dotenv import load_dotenv
from models.schemas import CodeReviewResponse, Bug, Suggestion, SeverityLevel

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are an expert senior software engineer performing a thorough code review. 
Your job is to analyze the provided code and return a detailed, structured JSON review.

You MUST respond with ONLY valid JSON — no markdown, no explanation outside the JSON.

Return this exact JSON structure:
{
  "language_detected": "string (e.g. Python, JavaScript, Java)",
  "score": number (0-100, honest quality score),
  "summary": "string (2-3 sentences summarizing the overall code quality and main issues)",
  "positive_aspects": ["string", ...],
  "bugs": [
    {
      "title": "string (short bug name)",
      "description": "string (clear explanation of what's wrong)",
      "line_reference": "string or null (e.g. 'Line 12' or 'Lines 20-25')",
      "severity": "low|medium|high|critical",
      "fix": "string (concrete fix suggestion or corrected code snippet)"
    }
  ],
  "suggestions": [
    {
      "title": "string (short suggestion name)",
      "description": "string (why this improvement matters)",
      "example": "string or null (code example showing the improvement)",
      "category": "string (one of: performance|readability|security|best-practice|maintainability)"
    }
  ]
}

Scoring guide:
- 90-100: Production-ready, clean, well-structured
- 70-89: Good code with minor issues
- 50-69: Functional but needs improvement
- 30-49: Multiple significant issues
- 0-29: Serious bugs, security issues, or broken logic

Be specific, honest, and helpful — like a senior engineer who wants the developer to grow."""

LANGUAGE_MAP = {
    "auto": "Detect the language automatically.",
    "python": "The code is Python.",
    "javascript": "The code is JavaScript.",
    "typescript": "The code is TypeScript.",
    "java": "The code is Java.",
    "go": "The code is Go.",
    "rust": "The code is Rust.",
    "cpp": "The code is C++.",
    "c": "The code is C.",
    "csharp": "The code is C#.",
    "ruby": "The code is Ruby.",
    "php": "The code is PHP.",
    "swift": "The code is Swift.",
    "kotlin": "The code is Kotlin.",
}


def _clean_json_response(text: str) -> str:
    """Strip markdown fences if the model wraps JSON in them."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _load_training_data() -> str:
    """Load reference files from the training_data folder AND the current project."""
    # 1. Load explicit training_data folder
    root_path = os.path.join(os.path.dirname(__file__), "..", "..") # CODE-PREVIEW root
    training_path = os.path.join(os.path.dirname(__file__), "..", "training_data")
    
    training_context = "\n\n--- REFERENCE KNOWLEDGE (PROJECT CONTEXT) ---\n"
    found_files = False
    
    # 2. Exclude folders
    exclude_dirs = {"venv", "node_modules", ".git", "__pycache__", ".github", ".vscode"}
    relevant_exts = {".py", ".md", ".txt", ".js", ".ts", ".css", ".html"}

    # Index project structure and snippets
    # We walk the root to get full project context!
    for root, dirs, files in os.walk(root_path):
        # Prune excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for filename in files:
            if any(filename.endswith(ext) for ext in relevant_exts):
                file_path = os.path.join(root, filename)
                # Skip the file currently being reviewed if needed? 
                # (Actually, better to include it for context)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        # Only take first 100 lines per file to avoid context blowup
                        content = "".join([f.readline() for _ in range(100)])
                        rel_path = os.path.relpath(file_path, root_path)
                        training_context += f"\nFILE: {rel_path}\n{content}\n"
                        found_files = True
                except Exception:
                    pass
                
    return training_context if found_files else ""


async def analyze_code(code: str, language: str = "auto", context: str = None) -> CodeReviewResponse:

    start_time = time.time()

    lang_hint = LANGUAGE_MAP.get(language.lower(), f"The code is {language}.")
    context_section = f"\n\nAdditional context from the developer:\n{context}" if context else ""
    
    # Load training data
    training_section = _load_training_data()

    user_prompt = f"""{lang_hint}
{training_section}

Review the following code thoroughly:

```
{code}
```
{context_section}

Return ONLY valid JSON as specified."""

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    response = model.generate_content(user_prompt)

    raw_text = response.text

    cleaned = _clean_json_response(raw_text)
    data = json.loads(cleaned)

    elapsed_ms = int((time.time() - start_time) * 1000)

    bugs = [Bug(**b) for b in data.get("bugs", [])]
    suggestions = [Suggestion(**s) for s in data.get("suggestions", [])]

    return CodeReviewResponse(
        language_detected=data.get("language_detected", language),
        score=data.get("score", 50),
        summary=data.get("summary", ""),
        positive_aspects=data.get("positive_aspects", []),
        bugs=bugs,
        suggestions=suggestions,
        review_time_ms=elapsed_ms,
    )
