# Cerebrio System Architecture Specification

This document details the software design, database schemas, agent workflows, and data processing pipelines that power Cerebrio.

---

## 🏛️ System Topology

Cerebrio uses a decoupled full-stack architecture separating the client-side user experience from the agent orchestration service.

```mermaid
graph TD
    User([User Browser]) -->|HTTP / WebSockets| NextJS[Next.js Client]
    
    subgraph frontend ["frontend (Next.js Application)"]
        NextJS -->|React Flow Canvas| Canvas[System UML & Concept Maps]
        NextJS -->|Dashboard UI| Dashboard[Analytics Dashboard]
        NextJS -->|Chat UI| Chatbot[Mentor Chat Components]
    end

    NextJS -->|API Requests| FastAPI[FastAPI Server]

    subgraph backend ["backend (Python Service)"]
        FastAPI -->|Routing| ProjectRouter[Project Router]
        FastAPI -->|Routing| LearningRouter[Learning Router]
        FastAPI -->|Routing| AnalyticsRouter[Analytics Router]
        
        subgraph agents ["Agno Agent Layers"]
            ProjectRouter -->|Invokes| GenAgent[Project Generation Agent]
            ProjectRouter -->|Invokes| GitAgent[GitHub Finder Agent]
            LearningRouter -->|Invokes| MapAgent[Concept Mapping Agent]
            LearningRouter -->|Invokes| QuizAgent[Quiz Assessment Agent]
            LearningRouter -->|Invokes| AdaptAgent[Adaptive Tutor Agent]
        end

        subgraph database_layer ["Data Storage & Vector RAG"]
            DB[(MongoDB Database)]
            DBFallback[In-Memory Mock Fallback]
            
            GenAgent -.->|CRUD| DB
            MapAgent -.->|CRUD| DB
            
            EmbedEngine[OpenAI Embeddings API] -->|Vector Cosine Similarity| RAG[Document Vector Lookup]
            RAG -.->|Read/Write| DB
        end
    end
    
    classDef highlight fill:#4f46e5,stroke:#312e81,color:#fff;
    classGen fill:#10b981,stroke:#065f46,color:#fff;
    class GenAgent,MapAgent,QuizAgent,AdaptAgent highlight;
    class DB,RAG classGen;
```

---

## 🗄️ Database Schema & Collections

Cerebrio uses **MongoDB** to persist profiles, blueprints, quiz attempts, and embeddings. When MongoDB is unavailable, it gracefully loads a JSON/in-memory simulated database to ensure uninterrupted functionality.

### 1. `users` Collection
Tracks student topic mastery percentages dynamically updated by the adaptive engine:
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "username": "string",
  "learning_progress": {
    "Supervised Learning": 0.85,
    "Neural Networks": 0.45
  },
  "created_at": "ISODate"
}
```

### 2. `projects` Collection
Persists generated codebase blueprints and coordinate mappings for React Flow diagrams:
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "title": "string",
  "description": "string",
  "technologies": ["string"],
  "complexity": "string",
  "uml_diagrams": {
    "architecture": { "nodes": [], "edges": [] },
    "use_case": { "nodes": [], "edges": [] },
    "class_diag": { "nodes": [], "edges": [] },
    "sequence": { "nodes": [], "edges": [] },
    "erd": { "nodes": [], "edges": [] }
  },
  "folder_structure": [],
  "created_at": "ISODate"
}
```

### 3. `documents` Collection
Stores metadata for uploaded PDFs and YouTube URL transcripts, including the concept maps:
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "title": "string",
  "source_type": "pdf | youtube",
  "source_url": "string | null",
  "summary": "string",
  "concept_map": {
    "concepts": [
      {
        "id": "string",
        "label": "string",
        "description": "string",
        "examples": ["string"],
        "interview_questions": ["string"],
        "parent_id": "string | null",
        "position": { "x": "number", "y": "number" }
      }
    ]
  },
  "processed_at": "ISODate"
}
```

### 4. `embeddings` Collection
Holds parsed chunks of text with their corresponding high-dimensional vector representations:
```json
{
  "_id": "ObjectId",
  "document_id": "string",
  "chunk_index": "number",
  "text": "string",
  "embedding": ["number"] // 1536-dimensional float vector
}
```

---

## 🤖 Agno Multi-Agent Orchestration

Cerebrio's agents are constructed using the **Agno AI** (formerly Phidata) agent framework coupled with `gpt-4o-mini` to enforce structured responses conforming to strict Pydantic schemas.

```
                    Raw User Prompt (Requirement Text)
                                  │
                                  ▼
                    Agno Project Generation Agent
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
     Generates folder_structure     Generates 5 UML Diagrams
       (Strict recursive JSON)     (Nodes + Edges with Positions)
                  │                               │
                  └───────────────┬───────────────┘
                                  ▼
                         React Flow Client
                      (Interactive Viewports)
```

### Schema Enforcements
To bypass OpenAI validation failures where `$ref` elements cannot contain sibling descriptions, the agent models are separated into:
1. **Definition Classes**: Hold attributes and descriptions (e.g., `UMLNodeData`, `FolderNodeResponse`).
2. **Structural Classes**: Represent diagrams containing node and edge arrays with direct model references without local descriptions (e.g., `UMLDiagramsResponse`).
3. **Model Rebuilding**: Evaluates recursive references at module loading using `FolderNodeResponse.model_rebuild()`.

---

## 🔍 Retrieval-Augmented Generation (RAG) Flow

The learning mentor uses a specialized RAG retrieval workflow to locate source-grounded answers:

```
User Query ──> [OpenAI Embeddings API] ──> Query Vector (1536d)
                                                 │
                                                 ▼
[MongoDB query] <── Fetch all chunks matching document_id
      │
      ▼
Compute Cosine Similarity (Numpy)
      │
      ▼
Rank chunks and extract top K (K=3)
      │
      ▼
Inject chunks into LLM prompt context ──> Learning Mentor response
```

1. **Text Chunking**: Source texts are segmented into 1,000-character snippets with a 200-character overlap.
2. **Embedding Generation**: Chunks are processed via the `text-embedding-3-small` model and saved to MongoDB.
3. **Similarity Retrieval**: Chunks are ranked via cosine similarity:
   $$\text{similarity} = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
4. **Context Injection**: The top 3 matching chunks are injected directly into the LLM system prompt as factual guidelines.
