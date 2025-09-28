from app import app, init_db

if __name__ == "__main__":
    init_db()
    # Explicitly setting host to '0.0.0.0' ensures it's accessible from the Next.js proxy.
    app.run(host='0.0.0.0', port=5000, debug=True)
