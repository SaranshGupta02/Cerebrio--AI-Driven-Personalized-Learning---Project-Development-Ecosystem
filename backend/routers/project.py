from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents.project_agent import project_generation_agent, github_agent, project_mentor_agent
from database import get_collection
from datetime import datetime

router = APIRouter(prefix="/api/project", tags=["Project Assistant"])

class GenerateProjectRequest(BaseModel):
    prompt: str
    user_id: str = "default_user"

class GitHubSearchRequest(BaseModel):
    query: str

class MentorChatRequest(BaseModel):
    project_id: str
    message: str
    history: List[Dict[str, str]] = [] # list of {"role": "user"|"assistant", "content": "..."}

@router.post("/generate")
async def generate_project(request: GenerateProjectRequest):
    try:
        # Run Agno agent to get structured project plans
        # Note: .run() returns a RunResponse whose .content is an instance of ProjectGenerationResponse
        run_response = project_generation_agent.run(request.prompt)
        project_data = run_response.content
        
        # Convert Pydantic output to dict for DB storage
        project_dict = project_data.model_dump()
        project_dict["user_id"] = request.user_id
        project_dict["created_at"] = datetime.utcnow()
        
        # Save to database
        projects_col = get_collection("projects")
        result = await projects_col.insert_one(project_dict)
        project_dict["_id"] = str(result.inserted_id)
        
        return project_dict
    except Exception as e:
        print(f"Error generating project details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/github")
async def recommend_github(request: GitHubSearchRequest):
    try:
        # Run Agno agent with tools to search GitHub and synthesize recommendation
        run_response = github_agent.run(f"Find repositories and summarize them for: {request.query}")
        # The content contains the text report
        return {"report": run_response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def mentor_chat(request: MentorChatRequest):
    try:
        # Fetch the project from database to provide system context to the agent
        projects_col = get_collection("projects")
        project = await projects_col.find_one({"_id": request.project_id})
        
        context = ""
        if project:
            context = (
                f"Active Project Title: {project.get('title')}\n"
                f"Description: {project.get('description')}\n"
                f"Technologies: {', '.join(project.get('technologies', []))}\n"
                f"Complexity: {project.get('complexity')}\n"
            )
        
        # Build prompt incorporating history and active context
        history_str = ""
        for msg in request.history:
            role = "User" if msg.get("role") == "user" else "Mentor"
            history_str += f"{role}: {msg.get('content')}\n"
            
        full_prompt = (
            f"Active Project Context:\n{context}\n"
            f"Conversation History:\n{history_str}\n"
            f"User's query: {request.message}\n"
            f"Provide your mentoring response."
        )
        
        run_response = project_mentor_agent.run(full_prompt)
        return {"response": run_response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{user_id}")
async def list_projects(user_id: str):
    try:
        projects_col = get_collection("projects")
        cursor = projects_col.find({"user_id": user_id})
        projects = await cursor.to_list(length=100)
        # Format Mongo ObjectId for JSON response
        for p in projects:
            p["_id"] = str(p["_id"])
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}")
async def get_project(project_id: str):
    try:
        projects_col = get_collection("projects")
        project = await projects_col.find_one({"_id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        project["_id"] = str(project["_id"])
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
