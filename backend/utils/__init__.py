from datetime import datetime, timezone


def parse_cursor(cursor_time_str, cursor_id_str):
    """
    Parse cursor params from the query string.
    Returns (cursor_time, cursor_id) or (None, None) if missing/invalid.
    Both must be present for the cursor to be valid — we can't use one without
    the other since they're a compound key.
    """
    if not cursor_time_str or not cursor_id_str:
        return None, None

    try:
        # URL encoding turns + into a space; restore it before parsing
        cursor_time = datetime.fromisoformat(cursor_time_str.replace(" ", "+").replace("Z", "+00:00"))
        cursor_id   = int(cursor_id_str)
        return cursor_time, cursor_id
    except (ValueError, TypeError):
        return None, None


def parse_snapshot_time(snapshot_time_str):
    """
    Parse the snapshot_time from the query string.
    If missing (first page request), returns current UTC time.
    This is the moment the user's browsing session started —
    new inserts after this point are invisible to them.
    """
    if not snapshot_time_str:
        return datetime.now(timezone.utc)

    try:
        # URL encoding turns + into a space; restore it before parsing
        return datetime.fromisoformat(snapshot_time_str.replace(" ", "+").replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return datetime.now(timezone.utc)


def parse_limit(limit_str, default, maximum):
    """Clamp the requested page size between 1 and the configured maximum."""
    try:
        limit = int(limit_str)
        return max(1, min(limit, maximum))
    except (ValueError, TypeError):
        return default


def build_cursor_response(products, limit):
    """
    Given a list of product dicts, build the API response shape.

    next_cursor is only included when there are more pages — the client
    passes cursor_time + cursor_id on the next request to continue.
    has_more tells the client whether to show a 'load more' button.
    """
    has_more = len(products) == limit

    response = {
        "products": products,
        "has_more": has_more,
    }

    if has_more and products:
        last = products[-1]
        response["next_cursor"] = {
            "cursor_time": last["updated_at"],
            "cursor_id":   last["id"],
        }

    return response