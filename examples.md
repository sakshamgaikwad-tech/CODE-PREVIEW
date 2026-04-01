# CODE-PREVIEW Training Data

This directory contains reference materials, best practices, and code examples that the AI will use to "learn" your project's coding standards.

## How to use:
1. Drop any `.py`, `.js`, `.md`, or `.txt` files into this folder.
2. The AI will automatically read these files and include them as "Reference Knowledge" in the next code review.

## Example Rule (Rule of Thumb):
- **Naming:** Use `PascalCase` for classes and `snake_case` for functions/variables.
- **Safety:** Always check for `None` before accessing attributes.
- **Performance:** Prefer list comprehensions over explicit loops where possible.

---

### Example: Good vs Bad Code

#### BAD:
```python
def Calculate(X,Y):
    res = X + Y
    return res
```

#### GOOD:
```python
def calculate_sum(val_a: float, val_b: float) -> float:
    """Calculates the sum of two numbers."""
    return val_a + val_b
```
