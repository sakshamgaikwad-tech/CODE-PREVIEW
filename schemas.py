from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Bug(BaseModel):
    title: str
    description: str
    line_reference: Optional[str] = None
    severity: SeverityLevel
    fix: Optional[str] = None


class Suggestion(BaseModel):
    title: str
    description: str
    example: Optional[str] = None
    category: str  # e.g. "performance", "readability", "security", "best-practice"


class CodeReviewRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(default="auto", description="Programming language of the code")
    context: Optional[str] = Field(None, description="Optional context about the code")


class CodeReviewResponse(BaseModel):
    language_detected: str
    score: int = Field(..., ge=0, le=100, description="Code quality score out of 100")
    bugs: List[Bug]
    suggestions: List[Suggestion]
    summary: str
    positive_aspects: List[str]
    review_time_ms: Optional[int] = None
