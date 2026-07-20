from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import ping_database, get_database
from routers.project import router as project_router
from routers.learning import router as learning_router
from routers.analytics import router as analytics_router
from dotenv import load_dotenv
import uvicorn
import os

load_dotenv()

app = FastAPI(title="Cerebrio AI Backend", version="1.0.0")

# CORS middleware config to allow frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project_router)
app.include_router(learning_router)
app.include_router(analytics_router)

@app.on_event("startup")
async def startup_db_client():
    is_connected = await ping_database()
    if is_connected:
        print("Connected to MongoDB successfully.")
    else:
        print("Warning: Could not connect to MongoDB.")

@app.get("/api/health")
async def health_check():
    db_status = await ping_database()
    return {
        "status": "healthy",
        "database": "connected" if db_status else "disconnected"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
