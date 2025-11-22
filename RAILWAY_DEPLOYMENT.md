# ✅ RAILWAY DEPLOYMENT CHECKLIST

## Before Deploying to Railway

### Code Quality
- ✅ No `.env` file in Git (check `.gitignore`)
- ✅ `application.py` uses `os.getenv()` for sensitive data
- ✅ All dependencies in `requirements.txt`
- ✅ Code tested locally and working

### Files to Push
- ✅ application.py
- ✅ requirements.txt
- ✅ templates/ folder
- ✅ static/ folder
- ✅ .env.example (template, no secrets)
- ✅ Documentation files

### Files NOT to Push
- ❌ .env (never!)
- ❌ venv/ (already in .gitignore)
- ❌ __pycache__/ (already in .gitignore)
- ❌ *.pyc files (already in .gitignore)

---

## After Code is Pushed to GitHub

### Step 1: Connect to Railway
- ✅ Go to railway.app
- ✅ Click "New Project"
- ✅ Select "Deploy from GitHub"
- ✅ Select your "compress" repository
- ✅ Choose "testing" branch

### Step 2: Set Environment Variables
- ✅ Go to project → Variables tab
- ✅ Add `GMAIL_PASSWORD = ceno ubmh qqpj qijl`
- ✅ Add `SECRET_KEY = cutcompress-super-secret-key-2025`
- ✅ Click "Deploy"

### Step 3: Monitor Deployment
- ✅ Click "Logs" tab
- ✅ Watch for "Build successful" message
- ✅ Wait for app to start (2-3 minutes)
- ✅ Should show "Connected to Railway"

### Step 4: Test the App
- ✅ Get your Railway URL
- ✅ Visit your app URL
- ✅ Try the contact form
- ✅ Check if email arrives

---

## Troubleshooting

### Problem: 502 Bad Gateway
**Cause**: Environment variables missing
**Solution**: Add GMAIL_PASSWORD and SECRET_KEY in Variables tab

### Problem: Build Failed
**Cause**: Missing dependencies or code error
**Solution**: 
- Check Railway logs for error message
- Fix locally and push again

### Problem: Email Not Sending
**Cause**: Wrong GMAIL_PASSWORD or not set
**Solution**: 
- Verify GMAIL_PASSWORD in Railway Variables
- Check Gmail app passwords settings
- Verify sender email is smartsamir0205@gmail.com

### Problem: Can't Access Website
**Cause**: Wrong URL or Railway not deployed
**Solution**:
- Check Railway dashboard for deployment status
- Copy exact URL from Railway dashboard
- Wait if deployment still in progress

---

## Security Notes

✅ Never share `.env` file
✅ Never upload `.env` to GitHub
✅ Never hardcode passwords
✅ Change SECRET_KEY in production
✅ Use Railway's vault for sensitive data

---

## Environment Variables for Railway

```
Key: GMAIL_PASSWORD
Value: ceno ubmh qqpj qijl

Key: SECRET_KEY
Value: cutcompress-super-secret-key-2025
```

These should be set in Railway dashboard, NOT in code.

---

## Quick Deploy Command

```bash
# 1. Verify .env is in .gitignore
git status  # Should NOT show .env

# 2. Push code to GitHub
git push -u origin testing

# 3. Go to Railway and set variables (web UI)

# 4. Click Deploy button in Railway

# Done! ✅
```

---

**Deployment Status**: Ready to Deploy
**Security**: Protected (no passwords in Git)
**Time to Deploy**: ~5 minutes
