# Cerebrio: AI-Driven Personalized Learning & Project Development Ecosystem

Cerebrio is a unified AI-powered ecosystem designed to assist developers and learners through two major components: **AI Project Development Assistant** and **AI Personalized Learning System**. The system continuously analyzes user interactions to generate custom diagrams, adaptive quizzes, learning recommendations, and code guidelines.

---

## 🚀 Key Modules

### Module 1: AI Project Development Assistant
Helps users plan software projects from initial concept to scaffolding:
- **Interactive UML & System Design**: Generates Use Cases, Class Diagrams, Sequence Diagrams, DB schemas (ERD), and System Architecture configurations in a visual format powered by **React Flow**. Individual nodes can be clicked to inspect descriptions, responsibilities, and code templates.
- **Folder Structure Generator**: Creates an optimized directory layout template customized to selected tech stacks (MERN, Next.js, Django, FastAPI, etc.).
- **GitHub Similar Project Finder**: Uses the GitHub API to search for similar reference codebases, explaining their architecture and improvements.
- **Project AI Mentor**: Context-aware developer assistant chat widget.

### Module 2: AI Personalized Learning System
Converts any document or video lecture into an interactive study guide:
- **Intelligent Processing**: Extracts content from local PDFs and YouTube URL transcripts.
- **Interactive Concept Maps**: Explores topics through interactive clickable concept network diagrams in React Flow.
- **Adaptive Quiz Generator**: Generates MCQs and short-answer diagnostic assessments.
- **Adaptive Learning Engine**: Analyzes quiz attempts, highlights weak concepts, updates mastery tracking in MongoDB, and crafts custom remedial study lessons automatically.
- **Learning AI Mentor**: Context-aware RAG-based tutor.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (TypeScript, Tailwind CSS, Lucide icons, React Flow canvas)
- **Backend**: FastAPI (Python, Uvicorn server)
- **Agent Orchestrator**: Agno AI Agents (with OpenAI models)
- **Database & RAG**: MongoDB (Motor async driver, local cosine similarity vector storage)

---

## 📂 Project Directory Structure

```
AI-Teacher/
├── frontend/                      # Next.js Client
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Main Portal
│   │   ├── dashboard/page.tsx     # Analytics Dashboard
│   │   ├── project-assistant/     # Module 1 UI Canvas & Chats
│   │   └── learning-system/       # Module 2 UI Concept Maps & Quizzes
│   ├── components/
│   │   └── Navbar.tsx             # Nav Header
│   ├── tailwind.config.ts
│   └── package.json
└── backend/                       # Python Backend
    ├── main.py                    # Entrypoint
    ├── database.py                # MongoDB configuration with Mock fallback
    ├── models.py                  # Pydantic Schemas
    ├── requirements.txt           # Python packages
    ├── agents/
    │   ├── project_agent.py       # Agno Project Agents
    │   └── learning_agent.py      # Agno Learning Agents
    └── routers/
        ├── project.py             # Endpoint routing for Module 1
        ├── learning.py            # Endpoint routing for Module 2
        └── analytics.py           # Dashboard analytics endpoint
```

---

## ⚙️ Setup and Installation

### 1. Prerequisite Settings
Verify that you have [Node.js](https://nodejs.org/) (v18+) and [Python 3.10+](https://www.python.org/) installed locally. A running MongoDB server is recommended, but not strictly required (the backend will automatically fall back to an in-memory/JSON mockup database if MongoDB is offline).

### 2. Backend Setup
1. Change directory to `backend/`:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - On Linux/macOS:
     ```bash
     source venv/bin/activate
     ```
3. Create a `.env` file from the environment template and fill in your OpenAI key and GitHub token:
   ```env
   MONGODB_URI=mongodb://localhost:27017/cerebrio
   OPENAI_API_KEY=sk-proj-your-api-key-here
   GITHUB_TOKEN=ghp_your-github-token-here
   ```
4. Start the FastAPI development server:
   ```bash
   python main.py
   ```
   The backend will run on `http://127.0.0.1:8000`.

### 3. Frontend Setup
1. Change directory to `frontend/`:
   ```bash
   cd ../frontend
   ```
2. Run the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## 🧪 Verification & Health Check
Verify the backend connection status by sending a request to the health-check route:
- **Endpoint**: `GET http://localhost:8000/api/health`
- **Output**:
  ```json
  {
    "status": "healthy",
    "database": "connected"
  }
  ```
