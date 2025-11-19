# Email Configuration Guide for Cutcompress Contact Form

## Quick Setup Instructions

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled
4. Go to https://myaccount.google.com/apppasswords
5. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your OS)
6. Google will generate a **16-character password** (with spaces)
7. Copy this password (removing spaces if needed)

### Step 2: Create .env File

1. Create a file named `.env` in the project root directory (same level as `application.py`)
2. Add this line:
   ```
   GMAIL_PASSWORD=your-16-character-password-here
   ```
   Example:
   ```
   GMAIL_PASSWORD=abcdefghijklmnop
   ```
3. Save the file

### Step 3: Install Dependencies

The following packages are already in `requirements.txt`:
- `Flask-Mail` - Email sending library
- `python-dotenv` - Environment variable loader

If not already installed, run:
```bash
pip install Flask-Mail python-dotenv
```

### Step 4: Test the Contact Form

1. Start the Flask application:
   ```bash
   python application.py
   ```
2. Go to http://127.0.0.1:5000/contact
3. Fill in the contact form with test data
4. Click "Send Message"
5. You should see a success message

### What Happens When Form is Submitted:

1. **Email to You**: Receives notification with contact details at smartsamir0205@gmail.com
2. **Email to User**: Sender receives confirmation email with their submission details
3. **Flash Message**: User sees success/error notification on the contact page

---

## Features Implemented:

✅ Contact form validation (required fields)
✅ Email notification to admin (smartsamir0205@gmail.com)
✅ Confirmation email to user
✅ Flash messages (success/error notifications)
✅ Error handling with user-friendly messages
✅ Secure password storage (via .env file)
✅ Reply-to header (user can reply to confirmation email)

---

## Troubleshooting:

### Issue: "SMTPAuthenticationError"
- **Solution**: Check that GMAIL_PASSWORD in .env is correct (16 characters without spaces)
- Regenerate the app password at https://myaccount.google.com/apppasswords

### Issue: "SMTPNotSupportedError"
- **Solution**: Check that 2-Step Verification is enabled on your Google Account
- Some accounts with less secure app access may need to enable that instead

### Issue: "Connection refused"
- **Solution**: Check your internet connection
- Ensure Gmail SMTP is accessible from your network

### Issue: Form not sending but no error message
- **Solution**: Check Flask console for error logs
- Ensure .env file is in the correct location (project root)

---

## Email Template Details:

### Admin Email (to: smartsamir0205@gmail.com)
- Sender name, email, phone
- Subject category
- Full message
- Newsletter subscription status
- Reply-to field set to user's email

### User Confirmation Email
- Personalized greeting with user's name
- Echo of their submission details
- Response time expectation (24-48 hours)
- Contact information for follow-up

---

## Security Notes:

1. ⚠️ Never commit `.env` file to Git
2. ✅ `.env` is already in `.gitignore` (by default)
3. ✅ Use Google App Passwords (more secure than full account password)
4. ✅ 2-Step Verification required for App Passwords
5. ✅ Email address is visible in source code (acceptable for public contact)

---

## Future Enhancements:

- [ ] Database storage of contact submissions
- [ ] Email templates (HTML formatting)
- [ ] Attachments support
- [ ] Newsletter subscription management
- [ ] Auto-reply based on subject category
- [ ] Admin dashboard for contact messages

---

Created: November 19, 2025
