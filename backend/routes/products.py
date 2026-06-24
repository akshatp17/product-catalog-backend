from flask import Blueprint, jsonify
from db import get_db, release_db

products_bp = Blueprint("products", __name__, url_prefix="/api")


# ─── GET /api/products ────────────────────────────────────────────────────────

@products_bp.route("/products", methods=["GET"])
def get_products():
    """
    Paginated product listing (cursor-based).
    Query params:
        limit         - items per page (default 20, max 100)
        category      - filter by category name (optional)
        snapshot_time - ISO timestamp; frozen at session start
        cursor_time   - created_at of last seen item (for page 2+)
        cursor_id     - id of last seen item (for page 2+)
    """
    # TODO: implement cursor pagination logic
    return jsonify({"message": "products endpoint — coming soon"}), 200


# ─── GET /api/categories ──────────────────────────────────────────────────────

@products_bp.route("/categories", methods=["GET"])
def get_categories():
    """
    Returns all distinct product categories.
    Used to populate the filter dropdown in the UI.
    """
    # TODO: implement after schema is created
    return jsonify({"message": "categories endpoint — coming soon"}), 200