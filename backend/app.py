from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import get_db, release_db
from routes import register_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    register_routes(app)

    @app.route("/health", methods=["GET"])
    def health():
        conn = None
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.close()
            return jsonify({"status": "ok", "db": "connected"}), 200
        except Exception as e:
            return jsonify({"status": "error", "detail": str(e)}), 500
        finally:
            if conn:
                release_db(conn)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, port=5000)