# Contabo VPS Setup Guide - Chatbot + CutCompress

এই গাইড অনুসরণ করে আপনার CutCompress প্রজেক্ট Contabo VPS তে সেটআপ করবেন।

## ১. Contabo VPS তে সংযোগ

```bash
ssh root@<your-vps-ip>
```

## ২. প্রয়োজনীয় প্যাকেজ ইনস্টল করুন

```bash
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv git curl wget
apt install -y nginx supervisor
```

## ৩. প্রজেক্ট ক্লোন করুন

```bash
cd /home
git clone https://github.com/artsamir/compress.git
cd compress
```

## ৪. Virtual Environment সেটআপ করুন

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## ৫. Ollama ইনস্টল করুন (AI Model এর জন্য)

Ollama হল একটি lightweight AI model runner যা Mistral/Llama2 চালায়।

```bash
# Ollama ডাউনলোড এবং ইনস্টল করুন
curl https://ollama.ai/install.sh | sh

# Ollama সার্ভিস শুরু করুন
ollama serve &

# নতুন টার্মিনালে, Mistral মডেল ডাউনলোড করুন (সবচেয়ে ভালো, 7B)
ollama pull mistral

# অথবা Llama2 (বড়, ভালো মানের)
ollama pull llama2

# অথবা Neural Chat (দ্রুত,가ালো)
ollama pull neural-chat
```

**মডেল সাইজ তুলনা:**
- **mistral** (7B) - সবচেয়ে ভালো ব্যালেন্স, দ্রুত, RAM-সাশ্রয়ী ✅
- **neural-chat** (7B) - খুবই দ্রুত, চ্যাট-অপটিমাইজড
- **llama2** (7B/13B) - আরো সঠিক কিন্তু ধীর

## ৬. Flask অ্যাপ রান করুন

```bash
# পোর্ট 5000 এ রান করুন
python application.py
```

## ৭. Nginx প্রক্সি কনফিগারেশন

`/etc/nginx/sites-available/compress` ফাইল তৈরি করুন:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

সক্রিয় করুন:
```bash
ln -s /etc/nginx/sites-available/compress /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## ৮. Supervisor দিয়ে অ্যাপ পরিচালনা করুন

`/etc/supervisor/conf.d/compress.conf` তৈরি করুন:

```ini
[program:compress]
directory=/home/compress
command=/home/compress/venv/bin/python application.py
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/compress.log

[program:ollama]
command=ollama serve
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ollama.log
```

সক্রিয় করুন:
```bash
supervisorctl reread
supervisorctl update
supervisorctl start compress
supervisorctl start ollama
```

## ৯. SSL Certificate (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

Nginx config আপডেট করুন:
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... বাকি কনফিগ
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## ১০. Chatbot টেস্ট করুন

ব্রাউজার খুলে যান: `https://your-domain.com`

নীচে ডান কোণে 💬 বাটন দেখবেন - ক্লিক করুন এবং প্রশ্ন জিজ্ঞাসা করুন।

## ১১. মনিটরিং

```bash
# লগ দেখুন
tail -f /var/log/compress.log
tail -f /var/log/ollama.log

# চেক করুন অ্যাপ চলছে কি না
curl http://localhost:5000

# Ollama স্ট্যাটাস চেক করুন
curl http://localhost:11434/api/tags
```

## ১২. ট্রাবলশুটিং

### Ollama সংযোগ ত্রুটি
```bash
# Ollama প্রসেস চেক করুন
ps aux | grep ollama

# পুনরায় শুরু করুন
killall ollama
ollama serve &
```

### Flask অ্যাপ ক্র্যাশ হলে
```bash
supervisorctl restart compress
```

### RAM সমস্যা? স্বয়প্রক্রিয় অপ্টিমাইজেশন
```bash
# Swap মেমোরি যোগ করুন (2GB)
dd if=/dev/zero of=/swapfile bs=1G count=2
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

## ১৩. পারফরম্যান্স টিপস

- **Mistral** চালান - সেরা ব্যালেন্স (7B মডেল)
- nginx + gunicorn ব্যবহার করুন দ্রুতের জন্য
- Redis যোগ করুন caching এর জন্য
- CDN যোগ করুন static ফাইলের জন্য

---

✅ সম্পন্ন! এখন আপনার chatbot AI লাইভ আছে।
