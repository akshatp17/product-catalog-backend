# Product Catalog Backend

A backend service for browsing and filtering a catalog of 200,000+ products with consistent pagination under concurrent data changes.

Built as part of the CodeVector Backend Take-Home Assignment.

## Tech Stack

- Python
- Flask
- PostgreSQL
- Psycopg2
- Neon PostgreSQL
- Render (deployment)

## Features

- Browse products ordered by newest first
- Filter by category
- Cursor-based pagination
- Consistent browsing experience while new products are inserted or updated
- Efficient querying on large datasets (200,000+ rows)
- Bulk data generation and seeding

---

## API Endpoints

### Get Products

```http
GET /api/products
```

### Query Parameters

| Parameter     | Type         | Description                            |
| ------------- | ------------ | -------------------------------------- |
| limit         | int          | Items per page (default: 20, max: 100) |
| category      | string       | Optional category filter               |
| snapshot_time | ISO datetime | Session snapshot timestamp             |
| cursor_time   | ISO datetime | Cursor timestamp from previous page    |
| cursor_id     | int          | Cursor id from previous page           |

### Example Request

```http
GET /api/products?limit=20&category=Electronics
```

### Example Response

```json
{
  "products": [...],
  "has_more": true,
  "snapshot_time": "2026-06-24T12:00:00Z",
  "next_cursor": {
    "cursor_time": "2026-06-23T09:15:00Z",
    "cursor_id": 450
  }
}
```

---

### Get Categories

```http
GET /api/categories
```

Returns all distinct product categories.

---

## Why Cursor Pagination?

A common solution is OFFSET pagination:

```sql
SELECT *
FROM products
ORDER BY updated_at DESC
LIMIT 20 OFFSET 20;
```

This works for static datasets but breaks when new products are inserted while a user is browsing.

Example:

Page 1 returns:

```text
E
D
```

New products are inserted:

```text
G
F
E
D
C
B
A
```

Page 2 using OFFSET now returns:

```text
E
D
```

again, causing duplicates and potentially skipping products.

---

## Solution: Cursor Pagination + Snapshot Isolation

This project combines two techniques:

### 1. Cursor Pagination

Instead of asking:

> Skip N rows

we ask:

> Give me rows after the last product I already saw.

The cursor is:

```text
(updated_at, id)
```

which guarantees deterministic ordering even when multiple rows share the same timestamp.

Example:

```sql
WHERE (updated_at, id) < (:cursor_time, :cursor_id)
ORDER BY updated_at DESC, id DESC
```

---

### 2. Snapshot-Based Browsing

When a user loads the first page, the server generates:

```text
snapshot_time = current_timestamp
```

Every subsequent request includes that same snapshot.

Example:

```sql
WHERE updated_at <= :snapshot_time
```

Any products inserted or updated after the browsing session starts are excluded from that user's result set.

This guarantees:

- No duplicates
- No missing products
- Stable pagination
- Consistent browsing experience

---

## Database Design

### Products Table

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

---

## Indexing Strategy

### Pagination Index

```sql
CREATE INDEX idx_products_updated_id
ON products (updated_at DESC, id DESC);
```

Supports:

```sql
ORDER BY updated_at DESC, id DESC
```

and cursor seeks.

### Category Filter Index

```sql
CREATE INDEX idx_products_category_updated_id
ON products (category, updated_at DESC, id DESC);
```

Supports:

```sql
WHERE category = ?
```

combined with pagination.

These indexes allow PostgreSQL to seek directly to the cursor position instead of scanning all 200,000 rows.

---

## Data Generation

The project includes a seed script that generates 200,000 products.

Data generation is performed using PostgreSQL set-based operations instead of inserting rows one at a time, making the seeding process significantly faster.

---

## Running Locally

### Clone Repository

```bash
git clone <repo-url>
cd product-catalog-backend
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Mac/Linux:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

Create a `.env` file:

```env
DATABASE_URL=your_postgres_connection_string
FLASK_DEBUG=1
```

### Run Application

```bash
python app.py
```

Server runs on:

```text
http://localhost:5000
```

---

## Design Decisions

- Chose PostgreSQL for strong indexing and row-value comparisons.
- Chose cursor pagination over OFFSET pagination to avoid duplicates and skipped records.
- Used `(updated_at, id)` as a compound cursor for deterministic ordering.
- Added snapshot isolation to guarantee consistency during concurrent inserts and updates.
- Used connection pooling to reduce database connection overhead.
- Kept routes thin and moved database logic into dedicated model/service layers.

---

## Future Improvements

- Full-text search
- Price range filtering
- Redis caching
- Infinite scroll frontend
- API rate limiting
- Automated tests
- Dockerized deployment
