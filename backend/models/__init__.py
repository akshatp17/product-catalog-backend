import psycopg2.extras
from db import get_db, release_db


def fetch_products(snapshot_time, limit, category=None, cursor_time=None, cursor_id=None):
    """
    Fetch one page of products using cursor-based pagination.

    snapshot_time  — upper bound on created_at; freezes the viewport so new
                     inserts don't shift rows during a browsing session.
    cursor_time    — created_at of the last item on the previous page.
    cursor_id      — id of the last item on the previous page.
    category       — optional filter; None means all categories.

    The compound (created_at, id) cursor handles timestamp ties correctly:
    if two rows share the same created_at, id breaks the tie deterministically.
    """
    conn = None
    try:
        conn = get_db()
        # RealDictCursor returns rows as dicts instead of tuples —
        # so we can pass them straight to jsonify without manual mapping.
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if cursor_time is None:
            # ── First page ───────────────────────────────────────────────────
            # No cursor yet — just apply the snapshot ceiling and optional
            # category filter, then take the first `limit` rows.
            cur.execute("""
                SELECT id, name, category, price,
                       created_at, updated_at
                FROM   products
                WHERE  created_at <= %(snapshot_time)s
                  AND  (%(category)s IS NULL OR category = %(category)s)
                ORDER  BY created_at DESC, id DESC
                LIMIT  %(limit)s
            """, {
                "snapshot_time": snapshot_time,
                "category":      category,
                "limit":         limit,
            })
        else:
            # ── Subsequent pages ─────────────────────────────────────────────
            # Row-value comparison: (created_at, id) < (cursor_time, cursor_id)
            # Postgres expands this as:
            #   created_at < cursor_time
            #   OR (created_at = cursor_time AND id < cursor_id)
            # The compound index makes this an instant seek — no table scan.
            cur.execute("""
                SELECT id, name, category, price,
                       created_at, updated_at
                FROM   products
                WHERE  created_at <= %(snapshot_time)s
                  AND  (created_at, id) < (%(cursor_time)s, %(cursor_id)s)
                  AND  (%(category)s IS NULL OR category = %(category)s)
                ORDER  BY created_at DESC, id DESC
                LIMIT  %(limit)s
            """, {
                "snapshot_time": snapshot_time,
                "cursor_time":   cursor_time,
                "cursor_id":     cursor_id,
                "category":      category,
                "limit":         limit,
            })

        rows = cur.fetchall()
        cur.close()

        # Serialize datetimes to ISO strings — jsonify can't handle them natively
        products = []
        for row in rows:
            product = dict(row)
            product["created_at"] = product["created_at"].isoformat()
            product["updated_at"] = product["updated_at"].isoformat()
            product["price"]      = float(product["price"])
            products.append(product)

        return products

    finally:
        if conn:
            release_db(conn)


def fetch_categories():
    """Return all distinct category names, sorted alphabetically."""
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT category
            FROM   products
            ORDER  BY category ASC
        """)
        rows = cur.fetchall()
        cur.close()
        return [row[0] for row in rows]
    finally:
        if conn:
            release_db(conn)