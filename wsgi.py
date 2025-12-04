# Gunicorn configuration for Contabo VPS
# File: wsgi.py

import os
from dotenv import load_dotenv
from application import application

load_dotenv()

if __name__ == '__main__':
    app = application
    port = os.getenv('PORT', 5000)
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='127.0.0.1', port=int(port), debug=debug)
