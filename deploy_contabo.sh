#!/bin/bash
# Contabo Deployment Script for CutCompress with Chatbot

set -e

echo "🚀 Starting CutCompress Deployment on Contabo..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/compress"
VENV_DIR="$PROJECT_DIR/venv"
USER="root"
DOMAIN=${1:-"cutcompress.com"}

echo -e "${BLUE}📝 Configuration${NC}"
echo "Project Dir: $PROJECT_DIR"
echo "Domain: $DOMAIN"
echo ""

# Step 1: Update system
echo -e "${BLUE}1️⃣  Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git curl wget nginx supervisor build-essential

# Step 2: Clone/Pull project
echo -e "${BLUE}2️⃣  Setting up project...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    git clone https://github.com/artsamir/compress.git $PROJECT_DIR
else
    cd $PROJECT_DIR
    git pull origin main
fi

cd $PROJECT_DIR

# Step 3: Setup virtual environment
echo -e "${BLUE}3️⃣  Setting up Python virtual environment...${NC}"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv $VENV_DIR
fi
source $VENV_DIR/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Step 4: Install Ollama
echo -e "${BLUE}4️⃣  Installing Ollama (AI Model Runner)...${NC}"
if ! command -v ollama &> /dev/null; then
    curl -fsSL https://ollama.ai/install.sh | sh
    echo -e "${GREEN}✅ Ollama installed${NC}"
else
    echo -e "${GREEN}✅ Ollama already installed${NC}"
fi

# Step 5: Configure supervisor for Flask app
echo -e "${BLUE}5️⃣  Configuring Supervisor...${NC}"
cat > /etc/supervisor/conf.d/compress.conf << EOF
[program:compress]
directory=$PROJECT_DIR
command=$VENV_DIR/bin/python application.py
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/compress.log
environment=FLASK_ENV=production,PORT=5000

[program:ollama]
command=ollama serve
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ollama.log
stopasgroup=true
EOF

supervisorctl reread
supervisorctl update

# Step 6: Configure Nginx
echo -e "${BLUE}6️⃣  Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/compress << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    location /static/ {
        alias $PROJECT_DIR/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/compress /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Step 7: Pull Ollama model
echo -e "${BLUE}7️⃣  Downloading AI Model (Mistral)...${NC}"
echo "This may take a few minutes (about 4GB download)..."
$VENV_DIR/bin/python -c "
import requests
try:
    response = requests.get('http://localhost:11434/api/tags', timeout=5)
    print('✅ Ollama is running')
except:
    print('⚠️  Ollama not running yet, starting service...')
    import subprocess
    subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    import time
    time.sleep(5)
"

# Download model in background
(ollama pull mistral &) &

# Step 8: Create .env file
echo -e "${BLUE}8️⃣  Creating .env configuration...${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env" << EOF
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
GMAIL_PASSWORD=your-gmail-app-password
MAIL_USERNAME=smartsamir0205@gmail.com
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
CHATBOT_ENABLED=true
EOF
    echo -e "${GREEN}✅ .env file created (edit it with your email credentials)${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 9: SSL Certificate
echo -e "${BLUE}9️⃣  Setting up SSL Certificate...${NC}"
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || true

# Update Nginx with SSL
cat > /etc/nginx/sites-available/compress << EOF
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 16M;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location /static/ {
        alias $PROJECT_DIR/static/;
        expires 30d;
    }
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF

nginx -t
systemctl restart nginx

# Step 10: Start services
echo -e "${BLUE}🔟 Starting services...${NC}"
supervisorctl start compress
supervisorctl start ollama

# Final status
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Status:${NC}"
supervisorctl status compress
supervisorctl status ollama
echo ""
echo -e "${GREEN}🌐 Your site is live at: https://$DOMAIN${NC}"
echo -e "${GREEN}💬 Chatbot available at: https://$DOMAIN (bottom right corner)${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Edit .env file with your Gmail credentials:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. Restart Flask app:"
echo "   supervisorctl restart compress"
echo ""
echo "3. View logs:"
echo "   tail -f /var/log/compress.log"
echo "   tail -f /var/log/ollama.log"
echo ""
echo -e "${BLUE}⚡ Performance Tips:${NC}"
echo "- Ollama (AI) uses ~4GB RAM - model loads on first request"
echo "- Your 8GB RAM: Flask(0.5GB) + Ollama(4GB) + System(3.5GB) = ✅ Good!"
echo "- Monitor with: free -h"
echo ""
