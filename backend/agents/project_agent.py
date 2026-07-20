import os
import requests
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Setup default model
model = OpenAIChat(id="gpt-4o-mini", api_key=OPENAI_API_KEY)

# --- Pydantic Schemas for Structured Output ---

class UMLNodeData(BaseModel):
    label: str = Field(description="Display label of the node")
    details: str = Field(description="Comprehensive explanation of this node's role")
    responsibilities: List[str] = Field(description="Key duties and functions of this component")
    code: Optional[str] = Field(None, description="Detailed mock implementation, code snippet, configuration, or API signature")

class UMLPosition(BaseModel):
    x: float
    y: float

class UMLNode(BaseModel):
    id: str = Field(description="Unique node identifier, e.g., 'user', 'frontend', 'auth_service'")
    type: str = Field("customNode", description="Node template type, set as 'customNode'")
    position: UMLPosition
    data: UMLNodeData

class UMLEdge(BaseModel):
    id: str = Field(description="Unique edge identifier, e.g., 'e-user-frontend'")
    source: str = Field(description="ID of source node")
    target: str = Field(description="ID of target node")
    label: Optional[str] = Field(None, description="Label showing transaction or relation")
    animated: bool = Field(False, description="True if indicating streaming, real-time message, or active queue")

class DiagramData(BaseModel):
    nodes: List[UMLNode]
    edges: List[UMLEdge]

class UMLDiagramsResponse(BaseModel):
    use_case: DiagramData
    class_diag: DiagramData
    sequence: DiagramData
    erd: DiagramData
    architecture: DiagramData

class FolderNodeResponse(BaseModel):
    name: str = Field(description="Name of the file or folder")
    type: str = Field(description="Type: 'file' or 'directory'")
    description: str = Field(description="Explanation of the file/folder's purpose")
    children: Optional[List['FolderNodeResponse']] = None

class ProjectGenerationResponse(BaseModel):
    title: str = Field(description="Summarized project title")
    description: str = Field(description="Analyzed project requirement description")
    technologies: List[str] = Field(description="Key framework and library recommendations identified")
    complexity: str = Field(description="Estimated project complexity (Easy, Medium, Hard)")
    uml_diagrams: UMLDiagramsResponse
    folder_structure: List[FolderNodeResponse]

FolderNodeResponse.model_rebuild()
ProjectGenerationResponse.model_rebuild()

# --- Tools ---

def find_similar_github_repositories(query: str) -> List[Dict[str, Any]]:
    """
    Search GitHub for similar open source projects.
    Args:
        query (str): The search term (e.g. 'MERN chat application' or 'Next.js SaaS boilerplate').
    Returns:
        List[Dict[str, Any]]: List of matching repository dictionaries with title, description, and link.
    """
    headers = {}
    if GITHUB_TOKEN and GITHUB_TOKEN != "your_github_token_here":
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            items = response.json().get("items", [])[:5]
            return [
                {
                    "name": item["full_name"],
                    "url": item["html_url"],
                    "description": item["description"] or "No description provided.",
                    "stars": item["stargazers_count"],
                    "language": item["language"] or "Unknown"
                }
                for item in items
            ]
    except Exception as e:
        print(f"Error calling GitHub API: {e}")
    # Return mock repositories in case API call fails or no token
    return [
        {
            "name": "example-boilerplate/react-fastapi",
            "url": "https://github.com",
            "description": f"A sample repository matching your requirements: {query}",
            "stars": 120,
            "language": "TypeScript"
        }
    ]

# --- Agno Agents Definitions ---

# 1. Project Generation Agent (Uses Structured Output via response_model)
project_generation_agent = Agent(
    model=model,
    output_schema=ProjectGenerationResponse,
    description="You are a Principal Software Architect who helps developers design software systems.",
    instructions=[
        "Analyze the project idea/requirements provided by the user.",
        "Recommend suitable frameworks (e.g., MERN, Next.js, Django, FastAPI) and estimate complexity (Easy, Medium, Hard).",
        "Generate 5 high-fidelity interactive UML diagrams formatted EXACTLY for React Flow:",
        "  - Use Case Diagram",
        "  - Class Diagram",
        "  - Sequence Diagram",
        "  - Entity Relationship (ER) Diagram",
        "  - System Architecture Diagram",
        "For each diagram, design logical coordinate positions (x, y) so they render without overlapping.",
        "Include rich details in the data payload: label, detailed responsibilities, explanation, and concrete code/schema example.",
        "Generate an optimized directory structure tree showing files and directories with clear descriptions explaining their roles."
    ]
)

# 2. GitHub Search Agent
github_agent = Agent(
    model=model,
    tools=[find_similar_github_repositories],
    description="You are a GitHub explorer agent.",
    instructions=[
        "Given a list of technologies or project goals, search GitHub for relevant reference implementations.",
        "Provide a summary of recommended repositories, explaining: 1) Why the repository is relevant, 2) Key architectural details, and 3) Potential ideas we can borrow."
    ]
)

# 3. Project Mentor Agent
project_mentor_agent = Agent(
    model=model,
    description="You are Cerebrio's Project Mentor, a friendly AI software developer who helps users implement their projects.",
    instructions=[
        "Provide clear code examples, debug tips, and architectural guidance based on the active project requirements.",
        "Explain structural decisions, database configurations, and authentication flows clearly.",
        "Always maintain context and reference the project structure and UML diagrams designed for the user."
    ]
)
