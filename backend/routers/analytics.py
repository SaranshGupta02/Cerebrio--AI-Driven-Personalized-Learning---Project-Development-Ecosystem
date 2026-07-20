from fastapi import APIRouter, HTTPException
from database import get_collection
from bson import ObjectId

router = APIRouter(prefix="/api/analytics", tags=["Analytics Dashboard"])

@router.get("/{user_id}")
async def get_user_analytics(user_id: str):
    try:
        # Fetch user profile to get mastery progress
        users_col = get_collection("users")
        user = await users_col.find_one({"user_id": user_id})
        progress = user.get("learning_progress", {}) if user else {}

        # Fetch projects count
        projects_col = get_collection("projects")
        projects_count = await projects_col.count_documents({"user_id": user_id})

        # Fetch documents processed
        doc_col = get_collection("documents")
        docs_count = await doc_col.count_documents({"user_id": user_id})

        # Fetch quiz attempts summary
        attempts_col = get_collection("attempts")
        cursor = attempts_col.find({"user_id": user_id})
        attempts = await cursor.to_list(length=100)

        quiz_scores = []
        recent_attempts = []
        for att in attempts:
            quiz_scores.append(att.get("score", 0.0))
            recent_attempts.append({
                "quiz_id": att.get("quiz_id"),
                "score": att.get("score"),
                "weak_concepts_count": len(att.get("weak_concepts", [])),
                "attempted_at": att.get("attempted_at")
            })

        avg_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0.0

        return {
            "concept_mastery": progress, # dict mapping concept name -> mastery float
            "projects_count": projects_count,
            "documents_count": docs_count,
            "average_quiz_score": avg_score,
            "recent_attempts": recent_attempts[:5] # top 5 recent attempts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
