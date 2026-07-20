"use client";

import { useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import ReactFlow, { Background, Controls, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import {
  BookOpen,
  Upload,
  Send,
  Loader2,
  Trophy,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  PlayCircle,
  MessageSquare
} from "lucide-react";

interface ConceptData {
  id: string;
  label: string;
  description: string;
  examples: string[];
  interview_questions: string[];
  parent_id?: string;
}

export default function LearningSystem() {
  const [activeTab, setActiveTab] = useState<"map" | "quiz" | "chat">("map");
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [conceptMap, setConceptMap] = useState<ConceptData[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<ConceptData | null>(null);

  // Uploader inputs
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Quiz state
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // RAG Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sendingChat, setSendingChat] = useState(false);

  // Fallback demo data
  const handleLoadDemo = () => {
    setDocumentId("demo_doc");
    setDocTitle("Introduction to Machine Learning (Demo)");
    const demoMap: ConceptData[] = [
      {
        id: "c1",
        label: "Machine Learning Basics",
        description: "The core domain of algorithms that learn patterns from data without being explicitly programmed.",
        examples: ["Email spam filters", "Credit card fraud detection"],
        interview_questions: ["What is the difference between supervised and unsupervised learning?", "What is overfitting and how do you prevent it?"]
      },
      {
        id: "c2",
        label: "Supervised Learning",
        description: "Algorithms trained on labeled data where input-output pairs are provided.",
        examples: ["House price prediction", "Image classification"],
        interview_questions: ["Explain linear regression.", "What is the purpose of a validation set?"],
        parent_id: "c1"
      },
      {
        id: "c3",
        label: "Unsupervised Learning",
        description: "Algorithms that find patterns and structures in unlabeled dataset clustering.",
        examples: ["Customer market segmentation", "Dimensionality reduction"],
        interview_questions: ["What is K-means clustering?", "Explain Principal Component Analysis (PCA)."],
        parent_id: "c1"
      }
    ];
    setConceptMap(demoMap);
    
    // Setup initial demo quiz
    setQuiz({
      _id: "demo_quiz",
      title: "Machine Learning Diagnostic Test",
      questions: [
        {
          id: "q1",
          type: "mcq",
          question: "Which of the following describes Supervised Learning?",
          options: [
            "Training on unlabeled datasets",
            "Training on labeled datasets with inputs and matching outputs",
            "Learning via environment rewards and penalties",
            "Grouping database documents without guidelines"
          ],
          correct_answer: "Training on labeled datasets with inputs and matching outputs",
          explanation: "Supervised learning relies on explicit training labels mapped to inputs.",
          difficulty: "easy",
          concept: "Supervised Learning"
        },
        {
          id: "q2",
          type: "short_answer",
          question: "Name one common technique used to group unlabeled data in Unsupervised Learning.",
          correct_answer: "K-means",
          explanation: "K-means clustering is a classic unsupervised grouping algorithm.",
          difficulty: "medium",
          concept: "Unsupervised Learning"
        }
      ]
    });
  };

  // Convert concept tree to React Flow format
  const flowNodes = useMemo(() => {
    if (conceptMap.length === 0) return [];
    
    // Set positions dynamically if not set
    return conceptMap.map((concept, index) => {
      let x = 400;
      let y = 50 + index * 140;
      
      // Basic layout tree positioning
      if (concept.parent_id) {
        const siblings = conceptMap.filter(c => c.parent_id === concept.parent_id);
        const sibIndex = siblings.findIndex(s => s.id === concept.id);
        const parentNode = conceptMap.find(c => c.id === concept.parent_id);
        const pX = parentNode ? 400 : 400;
        
        x = pX + (sibIndex - (siblings.length - 1) / 2) * 260;
        y = 200;
      }

      return {
        id: concept.id,
        type: "default",
        position: { x, y },
        data: { label: concept.label },
        style: {
          background: "rgba(17, 24, 39, 0.9)",
          color: "#fff",
          border: "1.5px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
        }
      };
    });
  }, [conceptMap]);

  const flowEdges = useMemo(() => {
    const edges: Edge[] = [];
    conceptMap.forEach((c) => {
      if (c.parent_id) {
        edges.push({
          id: `e-${c.parent_id}-${c.id}`,
          source: c.parent_id,
          target: c.id,
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 }
        });
      }
    });
    return edges;
  }, [conceptMap]);

  // Upload handlers
  async function handleYoutubeUpload() {
    if (!youtubeUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/learning/upload/youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      });
      if (res.ok) {
        const json = await res.json();
        setDocumentId(json._id);
        setDocTitle(json.title);
        setConceptMap(json.concept_map.concepts);
        setQuiz(null);
        setQuizResult(null);
        setAnswers({});
        setChatHistory([]);
      } else {
        throw new Error();
      }
    } catch (e) {
      alert("Failed processing video transcript. Please make sure the backend is active.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("user_id", "default_user");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/learning/upload/pdf`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        setDocumentId(json._id);
        setDocTitle(json.title);
        setConceptMap(json.concept_map.concepts);
        setQuiz(null);
        setQuizResult(null);
        setAnswers({});
        setChatHistory([]);
      } else {
        throw new Error();
      }
    } catch (e) {
      alert("Failed reading PDF file. Ensure you configure backend/.env OpenAI Keys.");
    } finally {
      setLoading(false);
    }
  }

  // Quiz generation and submit
  async function handleLoadQuiz() {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/learning/quiz/generate/${documentId}`, {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setQuiz(json);
        setQuizResult(null);
        setAnswers({});
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitQuiz() {
    if (!quiz || !documentId) return;
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/learning/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "default_user",
          quiz_id: quiz._id,
          answers
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setQuizResult(json);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSubmittingQuiz(false);
    }
  }

  // RAG Mentor Chat
  async function handleSendChat() {
    if (!chatInput || !documentId) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setSendingChat(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/learning/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          message: userMsg,
          history: chatHistory
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setChatHistory((prev) => [...prev, { role: "assistant", content: json.response }]);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSendingChat(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#030712]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel: Upload study source */}
        <aside className="w-80 border-r border-white/5 bg-slate-950/40 p-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-amber-400" /> Upload Material
              </h2>

              {/* PDF upload form */}
              <form onSubmit={handlePdfUpload} className="p-3 bg-slate-900/50 rounded-lg border border-white/5 text-xs mb-4">
                <label className="block text-slate-400 font-medium mb-2">Upload Lecture PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-500/20 file:text-indigo-400 file:cursor-pointer hover:file:bg-indigo-500/30 mb-3"
                />
                <button
                  type="submit"
                  disabled={loading || !pdfFile}
                  className="w-full rounded bg-indigo-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Upload className="h-3 w-3" /> Process PDF
                </button>
              </form>

              {/* YouTube video parser */}
              <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5 text-xs mb-4">
                <label className="block text-slate-400 font-medium mb-2">Import YouTube URL</label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?..."
                  className="w-full text-xs bg-slate-950 border border-white/10 rounded px-2 py-1.5 text-white placeholder-slate-600 focus:outline-none mb-3"
                />
                <button
                  onClick={handleYoutubeUpload}
                  disabled={loading || !youtubeUrl}
                  className="w-full rounded bg-indigo-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Parse YouTube
                </button>
              </div>

              {/* Try Demo Shortcut */}
              <button
                onClick={handleLoadDemo}
                className="w-full rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500 hover:text-white"
              >
                Or Load Demo Sandbox
              </button>
            </div>

            {/* Document summary info */}
            {documentId && (
              <div className="bg-slate-900/60 border border-white/5 rounded-lg p-3 text-xs">
                <p className="font-semibold text-white mb-1.5 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> Active Workspace
                </p>
                <p className="text-slate-300 font-bold mb-1 max-w-[200px] truncate">{docTitle}</p>
                <p className="text-[10px] text-slate-500">ID: {documentId}</p>
                
                {activeTab === "quiz" && !quiz && (
                  <button
                    onClick={handleLoadQuiz}
                    disabled={loading}
                    className="w-full mt-3 rounded bg-indigo-600 py-1.5 font-semibold text-white hover:bg-indigo-500 text-[10px] flex items-center justify-center gap-1"
                  >
                    Generate Adaptive Quiz
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 text-center mt-6">
            Upload text, slide decks, or lecture videos to generate adaptive modules automatically.
          </div>
        </aside>

        {/* Right workspace views */}
        <main className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-6 h-14">
            <div className="flex gap-4">
              {(["map", "quiz", "chat"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  disabled={!documentId}
                  className={`text-xs font-semibold py-4 border-b-2 capitalize transition-colors disabled:opacity-30 ${
                    activeTab === tab
                      ? "border-indigo-500 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "map" ? "Interactive Concept Map" : tab === "quiz" ? "Adaptive Assessments" : "RAG Mentor"}
                </button>
              ))}
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          </div>

          {/* Subpanels */}
          <div className="flex-1 relative overflow-hidden flex">
            
            {/* 1. Concept Map */}
            {activeTab === "map" && (
              <div className="flex-1 h-full relative flex">
                {conceptMap.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic">
                    Please upload study material or load the demo to inspect the Interactive Concept tree.
                  </div>
                ) : (
                  <>
                    <ReactFlow
                      nodes={flowNodes}
                      edges={flowEdges}
                      fitView
                      onNodeClick={(_, node) => {
                        const concept = conceptMap.find(c => c.id === node.id);
                        if (concept) setSelectedConcept(concept);
                      }}
                      className="bg-[#030712]"
                    >
                      <Background color="#1f2937" gap={16} size={1} />
                      <Controls className="bg-slate-900 border-white/5" />
                    </ReactFlow>

                    {selectedConcept && (
                      <div className="absolute top-4 right-4 bottom-4 w-80 glass-panel rounded-xl p-4 overflow-y-auto flex flex-col justify-between border border-white/10 shadow-2xl">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Concept Node details</h4>
                            <button
                              onClick={() => setSelectedConcept(null)}
                              className="text-[10px] text-slate-500 hover:text-white border border-white/10 px-1.5 py-0.5 rounded"
                            >
                              Close
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-white mb-2">{selectedConcept.label}</h3>
                          <p className="text-slate-400 text-xs leading-relaxed mb-5">{selectedConcept.description}</p>

                          <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                            <PlayCircle className="h-3.5 w-3.5 text-emerald-400" /> Real-World Examples
                          </h5>
                          <ul className="space-y-1.5 mb-5 pl-1">
                            {selectedConcept.examples.map((ex, i) => (
                              <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                                <span className="text-emerald-400 mt-1">&bull;</span>
                                {ex}
                              </li>
                            ))}
                          </ul>

                          <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                            <HelpCircle className="h-3.5 w-3.5 text-amber-400" /> Interview Diagnostics
                          </h5>
                          <ul className="space-y-2 mb-4 pl-1">
                            {selectedConcept.interview_questions.map((q, i) => (
                              <li key={i} className="text-slate-300 text-[11px] leading-relaxed border-l-2 border-amber-500/40 pl-2">
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* 2. Adaptive Quiz */}
            {activeTab === "quiz" && (
              <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto h-full">
                {quizResult ? (
                  /* Graded Results Screen */
                  <div className="glass-panel border border-white/5 rounded-xl p-6">
                    <div className="flex flex-col items-center text-center border-b border-white/5 pb-6 mb-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 animate-bounce">
                        <Trophy className="h-8 w-8" />
                      </div>
                      <h2 className="text-xl font-bold text-white mb-1">Assessment Diagnostic Report</h2>
                      <p className="text-xs text-slate-400">Score Achieved:</p>
                      <p className="text-4xl font-extrabold text-indigo-400 mt-2">{quizResult.score.toFixed(0)}%</p>
                    </div>

                    <div className="space-y-6">
                      {/* Weak concepts warning */}
                      {quizResult.weak_concepts?.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="h-4 w-4" /> Gaps Identified (Weak Concepts)
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {quizResult.weak_concepts.map((wc: string) => (
                              <span key={wc} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold">
                                {wc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI remedial study guide recommendations */}
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">AI Tutor Recommendations</h3>
                        <div className="space-y-3">
                          {quizResult.recommended_study?.map((study: string, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-white/5 text-xs text-slate-300 leading-relaxed">
                              {study}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evaluator feedback */}
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Tutor Feedback</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{quizResult.feedback}</p>
                      </div>

                      <button
                        onClick={() => {
                          setQuizResult(null);
                          setAnswers({});
                        }}
                        className="w-full mt-4 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
                      >
                        Retake Assessment
                      </button>
                    </div>
                  </div>
                ) : quiz ? (
                  /* Quiz Form Screen */
                  <div className="glass-panel border border-white/5 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-2">{quiz.title}</h2>
                    <p className="text-xs text-slate-400 mb-6">Complete the questions below. Difficulty adjusts dynamically based on scores.</p>
                    
                    <div className="space-y-6 mb-8">
                      {quiz.questions.map((q: any, idx: number) => (
                        <div key={q.id} className="p-4 bg-slate-900/20 border border-white/5 rounded-lg text-xs">
                          <div className="flex items-center justify-between mb-3 text-[10px] text-slate-500">
                            <span>Question {idx + 1} of {quiz.questions.length}</span>
                            <span className="font-bold text-indigo-400 uppercase">{q.concept}</span>
                          </div>
                          <p className="text-slate-200 font-semibold mb-4 leading-relaxed">{q.question}</p>

                          {q.type === "mcq" ? (
                            <div className="grid gap-2">
                              {q.options?.map((opt: string) => (
                                <label
                                  key={opt}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer text-slate-300 hover:text-white transition-colors ${
                                    answers[q.id] === opt ? "bg-indigo-500/10 border-indigo-500/50 text-white" : ""
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value={opt}
                                    checked={answers[q.id] === opt}
                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                    className="accent-indigo-500"
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              value={answers[q.id] || ""}
                              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                              placeholder="Write a concise explanation answer..."
                              className="w-full text-xs h-20 bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submittingQuiz || Object.keys(answers).length < quiz.questions.length}
                      className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {submittingQuiz && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Submit Diagnostic Answers
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-20 text-xs text-slate-500 italic">
                    Select a document in the sidebar to generate a diagnostic quiz.
                  </div>
                )}
              </div>
            )}

            {/* 3. RAG Mentor Chat */}
            {activeTab === "chat" && (
              <div className="flex-1 p-6 flex flex-col justify-between max-w-3xl mx-auto h-full">
                <div className="glass-panel border border-white/5 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[300px] mb-4">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 text-xs pr-1">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 italic">
                        Ask questions about the uploaded study materials. The AI Mentor will look up facts using vector chunk embeddings.
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                          <span className="text-[10px] text-slate-500 font-bold mb-0.5">
                            {msg.role === "user" ? "You" : "Learning AI Mentor"}
                          </span>
                          <div
                            className={`rounded-lg p-3 leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                              msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-900 border border-white/5 text-slate-200"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {sendingChat && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 mx-auto" />}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Ask questions about this lecture text..."
                      className="flex-1 text-xs bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={!chatInput}
                      className="bg-indigo-600 px-4 py-2.5 rounded-lg text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
