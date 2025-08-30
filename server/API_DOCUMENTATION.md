# 🚀 SachinNotebook API Documentation

Complete API reference for the SachinNotebook knowledge management system.

## 🌐 Base URL

```
http://localhost:3000
```

## 📋 API Endpoints

### 🔐 Core Document Management

#### Upload Documents
```http
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: PDF, CSV, Word, or text file
```

**Response:**
```json
{
  "success": true,
  "message": "Document processed successfully",
  "filename": "document.pdf",
  "chunks": 5
}
```

#### Process Website
```http
POST /api/website
Content-Type: application/json

Body:
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Website processed successfully",
  "url": "https://example.com",
  "title": "Page Title",
  "chunks": 3
}
```

#### Process YouTube Video
```http
POST /api/youtube
Content-Type: application/json

Body:
{
  "url": "https://youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "success": true,
  "message": "YouTube video processed successfully",
  "url": "https://youtube.com/watch?v=VIDEO_ID",
  "title": "Video Title",
  "chunks": 4
}
```

#### Process Text Content
```http
POST /api/text
Content-Type: application/json

Body:
{
  "content": "Your text content here..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Text processed successfully",
  "chunks": 2
}
```

### 💬 AI Chat Interface

#### Chat with AI
```http
POST /api/chat
Content-Type: application/json

Body:
{
  "message": "What is artificial intelligence?",
  "sessionId": "session_1234567890"
}
```

**Response:**
```json
{
  "response": "Based on your documents, artificial intelligence is...",
  "sources": ["document1.pdf", "website1.com"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 🧠 Gemini AI Features

#### Service Status
```http
GET /api/gemini/status
```

**Response:**
```json
{
  "available": true,
  "model": {
    "type": "free",
    "name": "gemini-1.5-flash",
    "isPro": false,
    "description": "Fast and free Gemini model"
  },
  "apiKeyConfigured": true,
  "safetySettings": 4
}
```

#### Content Summarization
```http
POST /api/gemini/summarize
Content-Type: application/json

Body:
{
  "content": "Long content to summarize...",
  "maxLength": 200
}
```

**Response:**
```json
{
  "summary": "Condensed summary of the content...",
  "originalLength": 1500,
  "summaryLength": 180
}
```

#### Content Analysis
```http
POST /api/gemini/analyze
Content-Type: application/json

Body:
{
  "content": "Content to analyze..."
}
```

**Response:**
```json
{
  "topics": ["AI", "Machine Learning"],
  "contentType": "technical",
  "readingLevel": "intermediate",
  "keyEntities": ["OpenAI", "GPT"],
  "mainThemes": ["Artificial Intelligence"],
  "summary": "Brief analysis summary",
  "estimatedReadingTime": "5 minutes"
}
```

#### Query Enhancement
```http
POST /api/gemini/enhance-query
Content-Type: application/json

Body:
{
  "query": "What is AI?"
}
```

**Response:**
```json
{
  "enhancedQuery": "What is artificial intelligence and how does it work?",
  "relatedTerms": ["machine learning", "neural networks"],
  "queryIntent": "factual",
  "searchStrategy": "semantic",
  "suggestedFilters": ["technology", "computer science"]
}
```

### 🔍 System Information

#### Get System Prompt
```http
GET /api/system/prompt
```

**Response:**
```json
{
  "prompt": "Current system prompt configuration..."
}
```

#### Update System Prompt
```http
PUT /api/system/prompt
Content-Type: application/json

Body:
{
  "prompt": "New system prompt..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "System prompt updated successfully"
}
```

## 📊 Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## 🔧 Error Handling

### Standard Error Response
```json
{
  "error": "Error description",
  "details": "Additional error information",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Rate Limiting
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 16,
  "message": "Please wait before making another request"
}
```

## 🚀 Performance

- **Response Time**: 1-3 seconds for AI responses
- **File Processing**: 2-10 seconds depending on file size
- **Vector Search**: 100-500ms for similarity search
- **AI Generation**: 800ms-2 seconds with Gemini Flash

## 💡 Best Practices

1. **File Uploads**: Use multipart/form-data for file uploads
2. **Session Management**: Maintain sessionId for conversation context
3. **Error Handling**: Always check response status and handle errors
4. **Rate Limiting**: Implement exponential backoff for retries
5. **Content Length**: Keep text content under 10,000 characters for optimal performance

## 🔒 Security

- **API Keys**: Store securely in environment variables
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Built-in protection against abuse
- **Content Filtering**: AI responses are filtered for safety

## 📱 Mobile Considerations

- **Responsive Design**: API supports mobile-first applications
- **Touch Optimization**: Large touch targets and gestures
- **Offline Support**: Graceful degradation when offline
- **Performance**: Optimized for mobile network conditions

---

For more information, see the main README.md file.
