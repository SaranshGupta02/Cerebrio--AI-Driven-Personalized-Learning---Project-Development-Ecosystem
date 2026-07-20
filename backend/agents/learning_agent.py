import os
import re
import numpy as np
import requests
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from youtube_transcript_api import YouTubeTranscriptApi
from pypdf import PdfReader
from io import BytesIO
import openai
from dotenv import load_dotenv
from database import get_collection

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
model = OpenAIChat(id="gpt-4o-mini", api_key=OPENAI_API_KEY)
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

# --- Pydantic Schemas for Structured Output ---

class UMLPosition(BaseModel):
    x: float
    y: float

class ConceptNode(BaseModel):
    id: str = Field(description="Unique node identifier, e.g. 'c1', 'c2'")
    label: str = Field(description="Concept Name, e.g. 'Supervised Learning'")
    description: str = Field(description="Brief, clear explanation of this concept")
    examples: List[str] = Field(description="Real-world examples illustrating this concept")
    interview_questions: List[str] = Field(description="Frequently asked interview questions about this concept")
    parent_id: Optional[str] = Field(None, description="ID of parent concept, or null if root")
    position: UMLPosition

class ConceptMapResponse(BaseModel):
    concepts: List[ConceptNode] = Field(description="List of all concepts identified in the content structured hierarchically")

class QuizQuestionResponse(BaseModel):
    id: str = Field(description="Unique question identifier, e.g. 'q1', 'q2'")
    type: str = Field(description="Type of question: 'mcq' or 'short_answer'")
    question: str = Field(description="Question text")
    options: Optional[List[str]] = Field(None, description="4 option strings for MCQ, omit or empty for short_answer")
    correct_answer: str = Field(description="The correct answer text (matching option for MCQ, or concise correct answer for short_answer)")
    explanation: str = Field(description="Detailed explanation of why this answer is correct")
    difficulty: str = Field(description="Difficulty level: 'easy', 'medium', or 'hard'")
    concept: str = Field(description="The matching Concept Node Label this question tests, e.g., 'Supervised Learning'")

class QuizResponse(BaseModel):
    title: str = Field(description="Quiz Title")
    questions: List[QuizQuestionResponse] = Field(description="List of quiz questions")

class AdaptiveRecommendationResponse(BaseModel):
    weak_concepts: List[str] = Field(description="List of concept labels where the user failed")
    recommened_study: List[str] = Field(description="Actionable study recommendations, explanations, or simplified summaries for weak concepts")
    feedback: str = Field(description="Motivational feedback summarizing strengths and areas of improvement")

# --- Content Parsing Utilities ---

def extract_youtube_video_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'embed\/([0-9A-Za-z_-]{11})',
        r'youtu.be\/([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def fetch_youtube_transcript(video_url: str) -> str:
    """Fetch transcripts from YouTube URL."""
    video_id = extract_youtube_video_id(video_url)
    if not video_id:
        return "Error: Invalid YouTube URL"
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join([item["text"] for item in transcript_list])
    except Exception as e:
        return f"Error fetching YouTube transcript: {str(e)}. Please summarize based on context."

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text content from raw PDF bytes."""
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        return f"Error parsing PDF: {str(e)}"

# --- RAG & Vector Utilities ---

def get_embedding(text: str, model_name="text-embedding-3-small") -> List[float]:
    """Generates embedding using OpenAI embeddings API."""
    try:
        text = text.replace("\n", " ")
        response = openai_client.embeddings.create(input=[text], model=model_name)
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        # Return a zero vector as fallback
        return [0.0] * 1536

def chunk_text(text: str, chunk_size=1000, overlap=200) -> List[str]:
    """Splits text into chunks with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))

async def query_vector_search(document_id: str, query: str, top_k=3) -> List[str]:
    """Retrieves the top K matching document chunks from MongoDB for RAG context."""
    query_vector = get_embedding(query)
    
    embeddings_col = get_collection("embeddings")
    cursor = embeddings_col.find({"document_id": document_id})
    chunks = await cursor.to_list(length=2000)
    
    if not chunks:
        return []
        
    scored_chunks = []
    for chunk in chunks:
        sim = cosine_similarity(query_vector, chunk["embedding"])
        scored_chunks.append((sim, chunk["text"]))
        
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    return [chunk[1] for chunk in scored_chunks[:top_k]]

# --- Agno Agents for Personalized Learning ---

# 1. Concept Map Generator Agent
concept_map_agent = Agent(
    model=model,
    output_schema=ConceptMapResponse,
    description="You are a Concept Mapping Expert who extracts hierarchical study topics.",
    instructions=[
        "Extract a tree of key concepts from the provided study content.",
        "Ensure concepts are linked using 'parent_id' references to construct a hierarchy.",
        "Calculate logical coordinate positions (x, y) for nodes in React Flow:",
        "  - The root concept should be at the top center (e.g., x=400, y=50).",
        "  - Sub-levels should fan out horizontally (e.g., child nodes separated by x distance and placed down at y+150).",
        "For each concept node, provide a clear description, real-world examples, and 3 interview questions."
    ]
)

# 2. Quiz Generator Agent
quiz_generator_agent = Agent(
    model=model,
    output_schema=QuizResponse,
    description="You are an Academic Assessment Creator specializing in personalized, adaptive exams.",
    instructions=[
        "Generate a balanced set of MCQs and short answer questions based on the provided content summary.",
        "Ensure each question is tagged with the specific Concept Name it tests (must match the labels in the concept map).",
        "Provide clear explanations for correct options, and set difficulty tags (easy, medium, hard)."
    ]
)

# 3. Adaptive Recommendation Agent
adaptive_recommendation_agent = Agent(
    model=model,
    output_schema=AdaptiveRecommendationResponse,
    description="You are a Personal Academic Tutor dedicated to helping students learn from their mistakes.",
    instructions=[
        "Analyze a student's quiz attempt history, showing the questions, correct answers, and the student's selected answers.",
        "Identify the concepts they struggled with (weak concepts).",
        "Provide highly descriptive, simplified, and easy-to-understand tutorial summaries for those weak concepts to teach them again.",
        "Deliver motivating, constructive feedback."
    ]
)

# 4. Learning Mentor Agent
learning_mentor_agent = Agent(
    model=model,
    description="You are Cerebrio's Learning Mentor. You assist students in reading materials and resolving query doubts.",
    instructions=[
        "Help the student understand difficult theoretical concepts by providing analogies, code snippets, or simplified summaries.",
        "Use retrieved document text chunks to provide factual answers to questions about uploaded documents (RAG).",
        "Always guide the student step-by-step toward master of their study topics."
    ]
)
