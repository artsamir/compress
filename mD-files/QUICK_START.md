# ⚡ QUICK START: Enable Email on Contact Form

## What You Need to Do

### 1️⃣ Get Password from Google (2 minutes)
- Open: https://myaccount.google.com/apppasswords
- Pick "Mail" and "Windows Computer"
- Copy the 16-character password Google shows

### 2️⃣ Create `.env` File (1 minute)
- Create a new file: `.env` (in same folder as `application.py`)
- Add this line:
  ```
  GMAIL_PASSWORD=paste-16-character-password-here
  ```
- Save it

### 3️⃣ Test It (1 minute)
- Go to: http://127.0.0.1:5000/contact
- Fill the form and click "Send Message"
- ✅ You should see: "Thank you! Your message has been sent successfully"
- Check email at **smartsamir0205@gmail.com**

---

## What Happens When Someone Submits

1. **You receive an email** with their name, email, message
2. **They receive confirmation email** saying "We got your message"
3. **Green notification** shows on the contact page

---

## Already Installed ✅
- Flask-Mail
- python-dotenv
- Flash messages (success/error notifications)

---

**That's it! 3 simple steps.** Read `EMAIL_SETUP.md` for detailed guide.
