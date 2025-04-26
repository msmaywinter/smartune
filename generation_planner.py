def get_generation_limits(original_count: int) -> dict:
    if original_count < 1:
        return {"success": False, "error": "כמות הסטים המקורית חייבת להיות גדולה מאפס."}

    max_gen = original_count * 2
    suggested_default = original_count

    return {
        "success": True,
        "max": max_gen,
        "min": 0,
        "default": suggested_default,
        "message": f"ניתן לג׳נרט עד {max_gen} סטים חדשים על בסיס {original_count} סטים שהועלו."
    }
