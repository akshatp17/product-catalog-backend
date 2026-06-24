import psycopg2
from psycopg2 import pool
from config import Config

connection_pool = psycopg2.pool.SimpleConnectionPool(
    1, 10,
    dsn=Config.DATABASE_URL
)

def get_db():
    return connection_pool.getconn()

def release_db(conn):
    connection_pool.putconn(conn)