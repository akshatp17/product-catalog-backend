from flask import Blueprint, jsonify, request
from config import Config
from models import fetch_products, fetch_categories
from utils import parse_cursor, parse_snapshot_time, parse_limit, build_cursor_response

products_bp = Blueprint("products", __name__, url_prefix="/api")


@products_bp.route("/products", methods=["GET"])
def get_products():
    """
    GET /api/products

    Query params:
        limit           int     items per page (default 20, max 100)
        category        str     filter by category (optional)
        snapshot_time   ISO     frozen session start time (omit on page 1)
        cursor_time     ISO     created_at of last seen item (omit on page 1)
        cursor_id       int     id of last seen item (omit on page 1)

    Example — page 1:
        /api/products?limit=20&category=Electronics

    Example — page 2 (using values from previous response):
        /api/products?limit=20&category=Electronics
            &snapshot_time=2024-01-20T12:00:00Z
            &cursor_time=2024-01-15T08:30:00Z
            &cursor_id=4521
    """
    try:
        limit         = parse_limit(
                            request.args.get("limit"),
                            Config.DEFAULT_PAGE_LIMIT,
                            Config.MAX_PAGE_LIMIT
                        )
        category      = request.args.get("category") or None
        snapshot_time = parse_snapshot_time(request.args.get("snapshot_time"))
        cursor_time, cursor_id = parse_cursor(
                            request.args.get("cursor_time"),
                            request.args.get("cursor_id")
                        )

        products = fetch_products(
            snapshot_time=snapshot_time,
            limit=limit,
            category=category,
            cursor_time=cursor_time,
            cursor_id=cursor_id,
        )

        response = build_cursor_response(products, limit)

        # Always echo snapshot_time back so the client can pass it on page 2+
        response["snapshot_time"] = snapshot_time.isoformat()

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch products", "detail": str(e)}), 500


@products_bp.route("/categories", methods=["GET"])
def get_categories():
    """GET /api/categories — returns list of all distinct category names."""
    try:
        categories = fetch_categories()
        return jsonify({"categories": categories}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch categories", "detail": str(e)}), 500