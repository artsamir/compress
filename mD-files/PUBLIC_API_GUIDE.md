# 🔌 Public Chatbot API Guide

আপনার CutCompress server থেকে অন্যরা chatbot API ব্যবহার করতে পারবে!

## 📌 API Endpoints

```
Base URL: https://your-domain.com/api/public-chatbot
```

### 1. **Ask Question** (Main Endpoint)
```
POST /api/public-chatbot/ask
```

**Request:**
```json
{
  "api_key": "your-api-key",
  "message": "কীভাবে background remove করি?",
  "context": "cutcompress"
}
```

**Response:**
```json
{
  "success": true,
  "message": "কীভাবে background remove করি?",
  "response": "To remove background: Upload image → Tool processes → Download result...",
  "model": "mistral",
  "processing_time": 2.5,
  "timestamp": "2025-12-05T10:30:45.123456"
}
```

---

### 2. **Get Available Models**
```
GET /api/public-chatbot/models?api_key=YOUR_KEY
```

**Response:**
```json
{
  "available": ["mistral", "fallback"],
  "default": "mistral",
  "descriptions": {
    "mistral": "Mistral 7B - Advanced AI (4-8 sec)",
    "fallback": "Knowledge base (<100ms)"
  },
  "ollama_available": ["mistral", "neural-chat"]
}
```

---

### 3. **Health Check**
```
GET /api/public-chatbot/health?api_key=YOUR_KEY
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T10:30:45.123456",
  "services": {
    "fallback": "active",
    "ollama": "active"
  }
}
```

---

### 4. **API Documentation**
```
GET /api/public-chatbot/docs
```
সব API endpoint এর জন্য সম্পূর্ণ documentation।

---

## 🔑 API Key Management

### Get API Key
1. Email করুন: `smartsamir0205@gmail.com`
2. বলুন: "আমি public chatbot API চাই"
3. Key পাবেন: `free-key-1`, `free-key-2`, etc

### Key Pass করার উপায়
```bash
# Method 1: Request Body
POST /api/public-chatbot/ask
{
  "api_key": "your-key",
  "message": "..."
}

# Method 2: Query Parameter
GET /api/public-chatbot/health?api_key=your-key

# Method 3: Header (upcoming)
Header: X-API-Key: your-key
```

---

## 💻 Usage Examples

### **Python**
```python
import requests

API_URL = "https://your-domain.com/api/public-chatbot/ask"
API_KEY = "free-key-1"

# Ask a question
response = requests.post(API_URL, json={
    "api_key": API_KEY,
    "message": "What tools do you offer?",
    "context": "cutcompress"
})

result = response.json()
print(result['response'])
```

### **JavaScript/Node.js**
```javascript
const apiKey = "free-key-1";
const message = "কীভাবে image convert করি?";

fetch("https://your-domain.com/api/public-chatbot/ask", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    api_key: apiKey,
    message: message,
    context: "cutcompress"
  })
})
.then(r => r.json())
.then(data => console.log(data.response));
```

### **cURL**
```bash
curl -X POST https://your-domain.com/api/public-chatbot/ask \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "free-key-1",
    "message": "এই সাইটে কী কী টুলস আছে?",
    "context": "cutcompress"
  }'
```

### **JavaScript (Frontend)**
```javascript
async function askChatbot(message) {
  const response = await fetch("/api/public-chatbot/ask", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      api_key: "free-key-1",
      message: message
    })
  });
  
  const data = await response.json();
  return data.response;
}

// Use it
const answer = await askChatbot("How to use this?");
console.log(answer);
```

---

## ⚙️ Rate Limiting

**Limit:** 10 requests per minute per API key

```
Status: 429 Too Many Requests
Response: {
  "success": false,
  "error": "Rate limit exceeded. Max 10 requests per minute",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## 📊 Response Formats

### ✅ Success Response (200)
```json
{
  "success": true,
  "message": "User's question",
  "response": "Chatbot's answer",
  "model": "mistral",
  "processing_time": 2.5,
  "timestamp": "2025-12-05T10:30:45.123456"
}
```

### ❌ Error Responses

**Invalid API Key (401)**
```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

**Rate Limited (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Max 10 requests per minute",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Empty Message (400)**
```json
{
  "success": false,
  "error": "Message is required",
  "code": "EMPTY_MESSAGE"
}
```

**Message Too Long (400)**
```json
{
  "success": false,
  "error": "Message too long (max 1000 characters)",
  "code": "MESSAGE_TOO_LONG"
}
```

**Server Error (500)**
```json
{
  "success": false,
  "error": "Error details here",
  "code": "INTERNAL_ERROR"
}
```

---

## 🚀 Advanced Usage

### Multi-Language Support
```json
{
  "api_key": "free-key-1",
  "message": "বাংলায় উত্তর দাও: কীভাবে background remove করি?",
  "context": "cutcompress"
}
```

### Custom Context
```json
{
  "api_key": "free-key-1",
  "message": "What's your main feature?",
  "context": "general"  // Instead of "cutcompress"
}
```

### Batch Requests (Recommended Approach)
```python
import requests

messages = [
  "How to remove background?",
  "What formats are supported?",
  "Is it free?"
]

results = []
for msg in messages:
  resp = requests.post("https://your-domain.com/api/public-chatbot/ask", 
    json={"api_key": "free-key-1", "message": msg})
  results.append(resp.json())
```

---

## 📈 Performance Tips

1. **Cache responses** - একই প্রশ্ন বারবার জিজ্ঞাসা করবেন না
2. **Use fallback model** - দ্রুত সাধারণ প্রশ্নের জন্য
3. **Batch requests** - একসাথে multiple কোয়েরি করুন
4. **Error handling** - সবসময় error response handle করুন

---

## 🔐 Security

- ✅ API Key ছাড়া কোনো request গ্রহণ করা হবে না
- ✅ Rate limiting দিয়ে abuse প্রতিরোধ
- ✅ Input validation (max 1000 chars)
- ✅ HTTPS recommended
- ✅ API Keys rotate করতে পারবেন

---

## 📞 Support

- Issues? Email: smartsamir0205@gmail.com
- Documentation: https://your-domain.com/api/public-chatbot/docs
- GitHub: https://github.com/artsamir/compress

---

## 🛠️ Environment Variables

`.env` ফাইলে এই variables সেট করতে পারো:

```bash
# API Configuration
CHATBOT_API_KEYS=free-key-1,free-key-2,premium-key-1
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_ENABLED=true
OLLAMA_MODEL=mistral

# Rate Limiting
CHATBOT_RATE_LIMIT=10  # requests per minute
```

---

**Ready to integrate? আপনার project এ এই API ব্যবহার করুন!** 🚀
