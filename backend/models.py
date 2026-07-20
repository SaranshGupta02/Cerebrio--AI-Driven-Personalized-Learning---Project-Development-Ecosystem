from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- General & User Models ---
class UserProfile(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    username: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    learning_progress: Dict[str, Any] = Field(default_factory=dict) # e.g. { "Machine Learning": 0.8 }

# --- Module 1: Project Assistant Models ---
class UMLDiagramNode(BaseModel):
    id: str
    type: str # e.g. 'customNode', 'resizable'
    data: Dict[str, Any] # e.g. { label: 'Auth Service', responsibilities: '...', code: '...' }
    position: Dict[str, float] # { x: float, y: float }

class UMLDiagramEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: Optional[bool] = False

class UMLDiagrams(BaseModel):
    use_case: Dict[str, Any] = Field(default_factory=dict)     # containing nodes/edges
    class_diag: Dict[str, Any] = Field(default_factory=dict)
    sequence: Dict[str, Any] = Field(default_factory=dict)
    erd: Dict[str, Any] = Field(default_factory=dict)
    architecture: Dict[str, Any] = Field(default_factory=dict)

class FolderNode(BaseModel):
    name: str
    type: str # 'file' or 'directory'
    children: Optional[List[Any]] = None # List of FolderNode
    description: str

class ProjectInfo(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    technologies: List[str]
    complexity: str
    uml_diagrams: UMLDiagrams
    folder_structure: Dict[str, Any] # nested dict structure
    github_repos: List[Dict[str, Any]]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Module 2: Personalized Learning Models ---
class ConceptNode(BaseModel):
    id: str
    label: str
    description: str
    subconcepts: List[str] = Field(default_factory=list)
    examples: List[str] = Field(default_factory=list)
    interview_questions: List[str] = Field(default_factory=list)

class DocumentMetadata(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    source_type: str # 'pdf' or 'youtube'
    source_url: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

class QuizQuestion(BaseModel):
    id: str
    type: str # 'mcq', 'coding', 'short_answer'
    question: str
    options: Optional[List[str]] = None # Only for MCQ
    correct_answer: str
    explanation: str
    difficulty: str # 'easy', 'medium', 'hard'

class Quiz(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    document_id: str
    title: str
    questions: List[QuizQuestion]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuizAttempt(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    quiz_id: str
    answers: Dict[str, str] # question_id -> user answer
    score: float # percentage score
    weak_concepts: List[str]
    recommened_study: List[str]
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

# --- Chat Models ---
class ChatMessage(BaseModel):
    sender: str # 'user' or 'mentor'
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    session_type: str # 'project' or 'learning'
    context_id: str # project_id or learning/document_id
    messages: List[ChatMessage] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
