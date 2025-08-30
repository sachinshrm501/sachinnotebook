# 🧠 SachinNotebook

**Your Personal AI-Powered Knowledge Management System**

A modern, intelligent application that helps you organize, analyze, and interact with your knowledge base using advanced AI capabilities.

## ✨ Features

### 🔐 **User Management**
- **Secure Authentication**: JWT-based user registration and login
- **User Profiles**: Personal settings and preferences
- **Role-Based Access**: User and admin roles
- **Session Management**: Secure token handling

### 📚 **Knowledge Sources**
- **Document Upload**: PDF, CSV, Word, and text files
- **Website Analysis**: Extract and analyze web content
- **YouTube Integration**: Process video transcripts and descriptions
- **Text Input**: Direct text content analysis

### 🤖 **AI-Powered Features**
- **Gemini Integration**: Powered by Google's latest AI models
- **Smart Search**: Semantic search across your knowledge base
- **Intelligent Chat**: Context-aware conversations about your data
- **Content Analysis**: AI-powered insights and summaries

### 🎨 **Modern Interface**
- **Responsive Design**: Works perfectly on all devices
- **Dark Mode**: Beautiful light/dark theme switching
- **Intuitive UI**: Clean, professional interface
- **Real-time Updates**: Live chat and processing feedback

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **Docker** (for easy setup)
- **Google Gemini API Key**

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd SachinNotebook
```

### 2. Environment Setup
```bash
# Copy environment templates
cp server/env-example.txt server/.env
cp client/.env.example client/.env

# Edit server/.env with your configuration
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb://localhost:27017/sachinnotebook
JWT_SECRET=your-super-secret-jwt-key
```

### 3. Start Services
```bash
# Start MongoDB with Docker (Qdrant is cloud-hosted)
cd server
docker-compose up -d mongodb mongo-express

# Install dependencies
cd ../server && npm install
cd ../client && npm install

# Start the server
cd ../server && npm start

# Start the client (in new terminal)
cd ../client && npm run dev
```

### 4. Access Your Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **MongoDB**: http://localhost:27017
- **Mongo Express**: http://localhost:8081

## 🏗️ Architecture

### **Frontend (React + Vite)**
```
client/
├── src/
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles and Tailwind
│   └── main.jsx         # Application entry point
├── public/               # Static assets
├── tailwind.config.js    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

### **Backend (Node.js + Express)**
```
server/
├── src/
│   ├── index.js         # Main server file
│   ├── models/          # Database models
│   ├── services/        # Business logic services
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & validation
│   └── handlers/        # File processing handlers
├── docker-compose.yml    # Database services
└── package.json          # Dependencies and scripts
```

### **Database Layer**
- **MongoDB**: User management and data storage
- **Qdrant Cloud**: Vector database for semantic search (hosted on GCP)
- **Redis**: Caching and session management (optional)

## 🔧 Configuration

### **Environment Variables**

#### Server (.env)
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/sachinnotebook

# Qdrant Cloud (Vector Database)
QDRANT_URL=https://98c25d90-5c66-4fdd-925f-8d24fdd3cd9c.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.xJNoV76WVjdv2IVt4RamzcQSZ3GmvVyYMCHkBfhlZ3c

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

#### Client (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=SachinNotebook
```

## 📡 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get user profile

### **Knowledge Sources**
- `POST /api/sources/files` - Upload documents
- `POST /api/sources/websites` - Add websites
- `POST /api/sources/youtube` - Add YouTube videos
- `POST /api/sources/text` - Add text content

### **AI Features**
- `POST /api/chat` - AI-powered chat
- `POST /api/gemini/summarize` - Content summarization
- `POST /api/gemini/analyze` - Content analysis
- `POST /api/gemini/enhance-query` - Query enhancement

## 🛠️ Development

### **Available Scripts**

#### Server
```bash
npm start          # Start production server
npm run dev        # Start development server
npm run build      # Build for production
```

#### Client
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### **Code Structure**
- **ES6+ Modules**: Modern JavaScript syntax
- **Component-Based**: React functional components
- **Service Layer**: Clean separation of concerns
- **Middleware**: Authentication and validation
- **Error Handling**: Comprehensive error management

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Secure cross-origin requests

## 🚀 Deployment

### **Production Build**
```bash
# Build client
cd client && npm run build

# Build server
cd server && npm run build

# Start production server
cd server && npm start
```

### **Docker Deployment**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **OpenAI** for embeddings
- **React** for the frontend framework
- **Node.js** for the backend runtime
- **Tailwind CSS** for styling
- **MongoDB** for data storage
- **Qdrant** for vector search

## 📞 Support

- **Issues**: [GitHub Issues](your-repo-url/issues)
- **Documentation**: [Wiki](your-repo-url/wiki)
- **Email**: your-email@example.com

---

**Built with ❤️ for intelligent knowledge management**
