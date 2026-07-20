from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from agents.learning_agent import (
    fetch_youtube_transcript, extract_text_from_pdf, chunk_text, get_embedding,
    query_vector_search, concept_map_agent, quiz_generator_agent,
    adaptive_recommendation_agent, learning_mentor_agent
)
from database import get_collection
from datetime import datetime

router = APIRouter(prefix="/api/learning", tags=["Learning System"])

class YouTubeUploadRequest(BaseModel):
    url: str
    user_id: str = "default_user"

class QuizSubmitRequest(BaseModel):
    user_id: str
    quiz_id: str
    answers: Dict[str, str] # question_id -> user answer

class LearningChatRequest(BaseModel):
    document_id: str
    message: str
    history: List[Dict[str, str]] = []

@router.post("/upload/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Form("default_user")
):
    try:
        # Read file bytes
        contents = await file.read()
        text = extract_text_from_pdf(contents)
        if text.startswith("Error"):
            raise HTTPException(status_code=400, detail=text)
        
        # Save document metadata
        doc_col = get_collection("documents")
        doc_dict = {
            "title": file.filename,
            "source_type": "pdf",
            "user_id": user_id,
            "summary": text[:2000] + "...", # Store a short summary/preview
            "processed_at": datetime.utcnow()
        }
        doc_result = await doc_col.insert_one(doc_dict)
        doc_id = str(doc_result.inserted_id)
        doc_dict["_id"] = doc_id
        
        # Chunk text and store embeddings
        chunks = chunk_text(text)
        embeddings_col = get_collection("embeddings")
        
        print(f"Creating embeddings for {len(chunks)} chunks...")
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            await embeddings_col.insert_one({
                "document_id": doc_id,
                "chunk_index": i,
                "text": chunk,
                "embedding": embedding
            })
            
        # Generate concept map
        print("Generating interactive concept map...")
        run_response = concept_map_agent.run(f"Generate a concept map for the following study material:\n\n{text[:5000]}")
        concept_map = run_response.content.model_dump()
        
        # Save concept map to document database
        await doc_col.update_one({"_id": doc_id}, {"$set": {"concept_map": concept_map}})
        doc_dict["concept_map"] = concept_map
        
        return doc_dict
    except Exception as e:
        print(f"PDF upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload/youtube")
async def upload_youtube(request: YouTubeUploadRequest):
    try:
        text = fetch_youtube_transcript(request.url)
        if text.startswith("Error"):
            raise HTTPException(status_code=400, detail=text)
        
        # Save document metadata
        doc_col = get_collection("documents")
        doc_dict = {
            "title": "YouTube Video Study Guide",
            "source_type": "youtube",
            "source_url": request.url,
            "user_id": request.user_id,
            "summary": text[:2000] + "...",
            "processed_at": datetime.utcnow()
        }
        doc_result = await doc_col.insert_one(doc_dict)
        doc_id = str(doc_result.inserted_id)
        doc_dict["_id"] = doc_id
        
        # Chunk text and store embeddings
        chunks = chunk_text(text)
        embeddings_col = get_collection("embeddings")
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            await embeddings_col.insert_one({
                "document_id": doc_id,
                "chunk_index": i,
                "text": chunk,
                "embedding": embedding
            })
            
        # Generate concept map
        run_response = concept_map_agent.run(f"Generate a concept map for the following video transcript:\n\n{text[:5000]}")
        concept_map = run_response.content.model_dump()
        
        # Save concept map to document database
        await doc_col.update_one({"_id": doc_id}, {"$set": {"concept_map": concept_map}})
        doc_dict["concept_map"] = concept_map
        
        return doc_dict
    except Exception as e:
        print(f"YouTube processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/generate/{document_id}")
async def generate_quiz(document_id: str):
    try:
        # Fetch document
        doc_col = get_collection("documents")
        doc = await doc_col.find_one({"_id": document_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Check if quiz already exists
        quiz_col = get_collection("quizzes")
        existing_quiz = await quiz_col.find_one({"document_id": document_id})
        if existing_quiz:
            existing_quiz["_id"] = str(existing_quiz["_id"])
            return existing_quiz
            
        # Generate quiz from document summary
        run_response = quiz_generator_agent.run(f"Create a personalized quiz for the content:\n\n{doc.get('summary')}")
        quiz_data = run_response.content.model_dump()
        quiz_data["document_id"] = document_id
        quiz_data["created_at"] = datetime.utcnow()
        
        result = await quiz_col.insert_one(quiz_data)
        quiz_data["_id"] = str(result.inserted_id)
        
        return quiz_data
    except Exception as e:
        print(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/submit")
async def submit_quiz(request: QuizSubmitRequest):
    try:
        # Fetch quiz
        quiz_col = get_collection("quizzes")
        quiz = await quiz_col.find_one({"_id": request.quiz_id})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
            
        # Evaluate user score
        score_count = 0
        total_questions = len(quiz["questions"])
        graded_details = []
        
        for q in quiz["questions"]:
            user_ans = request.answers.get(q["id"], "").strip().lower()
            corr_ans = q["correct_answer"].strip().lower()
            is_correct = user_ans == corr_ans
            
            if is_correct:
                score_count += 1
                
            graded_details.append({
                "question_id": q["id"],
                "question": q["question"],
                "user_answer": request.answers.get(q["id"], ""),
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "concept": q["concept"]
            })
            
        score_pct = (score_count / total_questions) * 100 if total_questions > 0 else 0.0
        
        # Format evaluation summary for the tutor agent
        eval_summary = f"Quiz Title: {quiz['title']}\n"
        for detail in graded_details:
            eval_summary += (
                f"- Concept: {detail['concept']}\n"
                f"  Question: {detail['question']}\n"
                f"  User's Answer: {detail['user_answer']}\n"
                f"  Correct Answer: {detail['correct_answer']}\n"
                f"  Result: {'CORRECT' if detail['is_correct'] else 'INCORRECT'}\n"
            )
            
        # Run Adaptive Recommendation Agent to build study guide
        run_response = adaptive_recommendation_agent.run(
            f"Analyze the quiz results and outline recommendations:\n\n{eval_summary}"
        )
        recommendations = run_response.content.model_dump()
        
        # Save attempt details
        attempts_col = get_collection("attempts")
        attempt_record = {
            "user_id": request.user_id,
            "quiz_id": request.quiz_id,
            "score": score_pct,
            "graded_details": graded_details,
            "weak_concepts": recommendations["weak_concepts"],
            "recommended_study": recommendations["recommened_study"],
            "feedback": recommendations["feedback"],
            "attempted_at": datetime.utcnow()
        }
        
        result = await attempts_col.insert_one(attempt_record)
        attempt_record["_id"] = str(result.inserted_id)
        
        # Update user's concept mastery in profiles
        user_col = get_collection("users")
        user = await user_col.find_one({"user_id": request.user_id})
        if not user:
            user = {"user_id": request.user_id, "learning_progress": {}}
            await user_col.insert_one(user)
            
        progress = user.get("learning_progress", {})
        for detail in graded_details:
            c = detail["concept"]
            old_score = progress.get(c, 0.5)
            # update score: if correct, increase, if wrong, decrease
            if detail["is_correct"]:
                progress[c] = min(1.0, old_score + 0.1)
            else:
                progress[c] = max(0.0, old_score - 0.1)
                
        await user_col.update_one({"user_id": request.user_id}, {"$set": {"learning_progress": progress}})
        
        return attempt_record
    except Exception as e:
        print(f"Quiz submission failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def learning_chat(request: LearningChatRequest):
    try:
        # Vector Search to retrieve RAG chunks
        chunks = await query_vector_search(request.document_id, request.message, top_k=3)
        context = "\n\n".join(chunks)
        
        history_str = ""
        for msg in request.history:
            role = "User" if msg.get("role") == "user" else "Mentor"
            history_str += f"{role}: {msg.get('content')}\n"
            
        full_prompt = (
            f"Factual Document Context:\n{context}\n\n"
            f"Conversation History:\n{history_str}\n"
            f"User's question: {request.message}\n"
            f"Give a factual, helpful mentoring response."
        )
        
        run_response = learning_mentor_agent.run(full_prompt)
        return {"response": run_response.content}
    except Exception as e:
        print(f"Learning mentor chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{user_id}")
async def list_documents(user_id: str):
    try:
        doc_col = get_collection("documents")
        cursor = doc_col.find({"user_id": user_id})
        docs = await cursor.to_list(length=100)
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
