"""
Seed script — inserts 200,000 products in a single SQL statement using
Postgres generate_series(). No Python loop, no slow per-row inserts.

Run once:  python seed.py
"""

import psycopg2
import time
from config import Config

CATEGORIES = [
    'Electronics', 'Clothing', 'Books', 'Home', 'Sports',
    'Toys', 'Beauty', 'Automotive', 'Food', 'Garden'
]

def seed():
    conn = psycopg2.connect(Config.DATABASE_URL)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM products")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"Table already has {count} rows. Skipping seed.")
        cur.close()
        conn.close()
        return

    print("Seeding 200,000 products...")
    start = time.time()

    cur.execute("""
        INSERT INTO products (name, category, price, created_at, updated_at)
        SELECT
            'Product #' || gs,
            (ARRAY[
                'Electronics','Clothing','Books','Home','Sports',
                'Toys','Beauty','Automotive','Food','Garden'
            ])[floor(random() * 10 + 1)::int],
            round((random() * 990 + 10)::numeric, 2),
            NOW() - (random() * INTERVAL '365 days'),
            NOW() - (random() * INTERVAL '30 days')
        FROM generate_series(1, 200000) AS gs;
    """)

    conn.commit()
    elapsed = time.time() - start

    cur.execute("SELECT COUNT(*) FROM products")
    final_count = cur.fetchone()[0]

    print(f"Done! {final_count:,} products inserted in {elapsed:.2f}s")

    cur.close()
    conn.close()

if __name__ == "__main__":
    seed()