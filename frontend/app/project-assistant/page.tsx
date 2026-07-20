"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/Navbar";
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";
import {
  Layers,
  Send,
  GitBranch,
  FolderPlus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  Code,
  MessageSquare
} from "lucide-react";

// Types
interface CustomNodeData {
  label: string;
  details: string;
  responsibilities: string[];
  code?: string;
}

export default function ProjectAssistant() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"uml" | "folder" | "github">("uml");
  const [activeUml, setActiveUml] = useState<"use_case" | "class_diag" | "sequence" | "erd" | "architecture">("architecture");
  const [projectData, setProjectData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  
  // GitHub search state
  const [githubReport, setGithubReport] = useState<string>("");
  const [searchingGithub, setSearchingGithub] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sendingChat, setSendingChat] = useState(false);

  // Load sample project when the page loads so it isn't empty
  useEffect(() => {
    // Generate dummy fallback project so user has visual feedback right away
    const sample = {
      _id: "sample_1",
      title: "FastAPI + React SaaS App",
      description: "A premium software boilerplate containing stripe subscription billing, email verification, and system analytics.",
      technologies: ["React", "FastAPI", "MongoDB", "Stripe"],
      complexity: "Medium",
      uml_diagrams: {
        architecture: {
          nodes: [
            { id: "1", type: "default", position: { x: 50, y: 150 }, data: { label: "Client Frontend (React)", details: "Dynamic user dashboard UI", responsibilities: ["Render interactive routes", "Verify stripe checkouts"], code: "// app/dashboard/page.tsx\nexport default function Dashboard() { ... }" } },
            { id: "2", type: "default", position: { x: 300, y: 150 }, data: { label: "API Gateway (FastAPI)", details: "Central services gateway router", responsibilities: ["Validate JWT keys", "Throttle request counts"], code: "@app.get('/api/v1/auth')\ndef verify_token(): ..." } },
            { id: "3", type: "default", position: { x: 550, y: 80 }, data: { label: "Stripe Billing microservice", details: "Handles checkout integrations", responsibilities: ["Process billing plans", "Receive webhooks"], code: "stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)" } },
            { id: "4", type: "default", position: { x: 550, y: 220 }, data: { label: "MongoDB Database", details: "Flexible persistent document storage", responsibilities: ["Cache transaction sessions", "Write telemetry analytics logs"], code: "db.users.update_one({'_id': id}, {'$set': data})" } }
          ],
          edges: [
            { id: "e1-2", source: "1", target: "2", animated: true, label: "HTTPS / REST" },
            { id: "e2-3", source: "2", target: "3", animated: false, label: "Webhook Integration" },
            { id: "e2-4", source: "2", target: "4", animated: true, label: "Database CRUD" }
          ]
        },
        use_case: {
          nodes: [
            { id: "1", type: "default", position: { x: 100, y: 50 }, data: { label: "Subscriber Actor", details: "Standard billing customer", responsibilities: ["Subscribes to monthly plans", "Cancels billing tiers"] } },
            { id: "2", type: "default", position: { x: 400, y: 50 }, data: { label: "Checkout Plan", details: "Creates custom checkout sessions", responsibilities: ["Queries stripe API"] } }
          ],
          edges: [
            { id: "e1-2", source: "1", target: "2", animated: true }
          ]
        },
        class_diag: { nodes: [], edges: [] },
        sequence: { nodes: [], edges: [] },
        erd: { nodes: [], edges: [] }
      },
      folder_structure: [
        {
          name: "frontend",
          type: "directory",
          description: "Next.js visual client application",
          children: [
            { name: "app", type: "directory", description: "Standard Next.js App Router directories" },
            { name: "components", type: "directory", description: "Reusable UI blocks" }
          ]
        },
        {
          name: "backend",
          type: "directory",
          description: "FastAPI server router",
          children: [
            { name: "main.py", type: "file", description: "Backend router startup endpoint" },
            { name: "database.py", type: "file", description: "Mongo schema database client connection" }
          ]
        }
      ]
    };
    setProjectData(sample);
  }, []);

  // Format React Flow nodes & edges
  const flowNodes = useMemo(() => {
    if (!projectData?.uml_diagrams?.[activeUml]?.nodes) return [];
    return projectData.uml_diagrams[activeUml].nodes.map((n: any) => ({
      ...n,
      style: {
        background: "rgba(17, 24, 39, 0.9)",
        color: "#fff",
        border: "1.5px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "8px",
        padding: "10px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
      }
    }));
  }, [projectData, activeUml]);

  const flowEdges = useMemo(() => {
    if (!projectData?.uml_diagrams?.[activeUml]?.edges) return [];
    return projectData.uml_diagrams[activeUml].edges.map((e: any) => ({
      ...e,
      style: { stroke: "#6366f1", strokeWidth: 2 },
      labelBgStyle: { fill: "#111827", fillOpacity: 0.8 },
      labelStyle: { fill: "#a5b4fc", fontSize: 10 }
    }));
  }, [projectData, activeUml]);

  async function handleGenerate() {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/project/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const json = await res.json();
        setProjectData(json);
        setSelectedNode(null);
        setChatHistory([]); // Clear chat history for new project context
      } else {
        throw new Error("Failed generating project plan");
      }
    } catch (e) {
      console.log(e);
      alert("Error generating project. Make sure you set the OPENAI_API_KEY in backend/.env!");
    } finally {
      setLoading(false);
    }
  }

  async function handleFindGithub() {
    if (!projectData) return;
    setSearchingGithub(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/project/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: projectData.technologies.join(" ") }),
      });
      if (res.ok) {
        const json = await res.json();
        setGithubReport(json.report);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSearchingGithub(false);
    }
  }

  async function handleSendChat() {
    if (!chatInput || !projectData) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setSendingChat(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/project/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectData._id || "sample_1",
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

  // Recursive folder node tree rendering helper
  const FolderTree = ({ nodes }: { nodes: any[] }) => {
    return (
      <div className="pl-4 border-l border-white/5 space-y-1.5 mt-1.5">
        {nodes.map((node, i) => {
          const [open, setOpen] = useState(false);
          const isDir = node.type === "directory" || !!node.children;
          return (
            <div key={i} className="text-xs">
              <div
                className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-white/5 text-slate-300 hover:text-white"
                onClick={() => setOpen(!open)}
              >
                {isDir ? (
                  open ? <ChevronDown className="h-3.5 w-3.5 text-emerald-400" /> : <ChevronRight className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />
                )}
                <span className={isDir ? "font-bold" : ""}>{node.name}</span>
                <span className="text-[10px] text-slate-500 italic ml-auto max-w-[60%] truncate">{node.description}</span>
              </div>
              {isDir && open && node.children && (
                <FolderTree nodes={node.children} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#030712]">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Panel: Generation Prompt and Mentor Chat */}
        <aside className="w-80 border-r border-white/5 bg-slate-950/40 p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Input prompt */}
            <div>
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-400" /> Project Idea
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your project (e.g. MERN stack chat app with JWT authentication)"
                className="w-full text-xs h-24 rounded-lg bg-slate-900 border border-white/10 p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate Blueprint"}
              </button>
            </div>

            {/* Active project summary details */}
            {projectData && (
              <div className="bg-slate-900/60 border border-white/5 rounded-lg p-3 text-xs">
                <p className="font-semibold text-white mb-1.5">{projectData.title}</p>
                <p className="text-slate-400 text-[10px] leading-relaxed mb-3 truncate-3-lines">{projectData.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {projectData.technologies.map((t: string) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold text-[9px] uppercase">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-slate-500">
                  Complexity: <span className="text-emerald-400 font-bold">{projectData.complexity}</span>
                </div>
              </div>
            )}

            {/* Mentor Chat Panel */}
            <div className="flex-1 border-t border-white/5 pt-4 flex flex-col min-h-[220px]">
              <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-400" /> Project AI Mentor
              </h3>
              <div className="flex-1 bg-slate-900/40 rounded-lg p-2 overflow-y-auto text-[11px] space-y-3 mb-2 max-h-[250px]">
                {chatHistory.length === 0 ? (
                  <p className="text-slate-500 italic text-center mt-8">Ask code layout or authentication flow suggestions...</p>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-500 font-bold mb-0.5">
                        {msg.role === "user" ? "You" : "Mentor"}
                      </span>
                      <div
                        className={`rounded-lg p-2.5 leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                          msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {sendingChat && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 mx-auto" />}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Ask the mentor..."
                  className="flex-1 text-xs bg-slate-900 border border-white/10 rounded-lg px-2.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendChat}
                  className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-500 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Panel: Display Visual Worksheets */}
        <main className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden relative">
          {/* Main workspace tabs */}
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-6 h-14">
            <div className="flex gap-4">
              {(["uml", "folder", "github"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-semibold py-4 border-b-2 capitalize transition-colors ${
                    activeTab === tab
                      ? "border-indigo-500 text-white"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "uml" ? "System Design Canvas" : tab === "folder" ? "Folder Structure" : "GitHub References"}
                </button>
              ))}
            </div>

            {/* Subtabs for diagrams selection inside UML */}
            {activeTab === "uml" && (
              <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-lg border border-white/5">
                {(["architecture", "use_case", "class_diag", "sequence", "erd"] as const).map((diag) => (
                  <button
                    key={diag}
                    onClick={() => {
                      setActiveUml(diag);
                      setSelectedNode(null);
                    }}
                    className={`px-2.5 py-1 text-[10px] font-semibold rounded-md uppercase transition-colors ${
                      activeUml === diag ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {diag.replace("_diag", "")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 relative overflow-hidden flex">
            {/* 1. UML Canvas */}
            {activeTab === "uml" && (
              <div className="flex-1 h-full relative">
                {flowNodes.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 italic">
                    This diagram is empty for this blueprint. Check others!
                  </div>
                ) : (
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    fitView
                    onNodeClick={(_, node) => setSelectedNode(node)}
                    className="bg-[#030712]"
                  >
                    <Background color="#1f2937" gap={16} size={1} />
                    <Controls className="bg-slate-900 border-white/5" />
                  </ReactFlow>
                )}

                {/* Node details drawer layout */}
                {selectedNode && (
                  <div className="absolute top-4 right-4 bottom-4 w-72 glass-panel rounded-xl p-4 overflow-y-auto flex flex-col justify-between border border-white/10 shadow-2xl">
                    <div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Info className="h-4 w-4 text-indigo-400" /> Component Info
                        </h4>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="text-[10px] text-slate-500 hover:text-white border border-white/10 px-1.5 py-0.5 rounded"
                        >
                          Close
                        </button>
                      </div>

                      <p className="text-sm font-bold text-white mb-1.5">{selectedNode.data.label}</p>
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">{selectedNode.data.details}</p>

                      <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2">Responsibilities</h5>
                      <ul className="space-y-1.5 mb-5">
                        {selectedNode.data.responsibilities?.map((resp, i) => (
                          <li key={i} className="text-slate-300 text-xs flex items-start gap-1.5">
                            <span className="text-indigo-400 mt-1">&bull;</span>
                            {resp}
                          </li>
                        ))}
                      </ul>

                      {selectedNode.data.code && (
                        <div>
                          <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Code className="h-3.5 w-3.5 text-emerald-400" /> Implementation Blueprint
                          </h5>
                          <pre className="bg-slate-950 p-2.5 rounded-lg border border-white/5 font-mono text-[9px] text-emerald-400 overflow-x-auto whitespace-pre">
                            {selectedNode.data.code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Folder Structure */}
            {activeTab === "folder" && (
              <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto h-full">
                <div className="glass-panel border border-white/5 rounded-xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                    <FolderPlus className="h-4 w-4 text-emerald-400" /> Project Codebase Tree
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    A logical directories setup proposed by Cerebrio matching the project technologies stack.
                  </p>
                  {projectData?.folder_structure ? (
                    <FolderTree nodes={projectData.folder_structure} />
                  ) : (
                    <p className="text-xs text-slate-500 italic">No folder structure generated yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* 3. GitHub Recommendations */}
            {activeTab === "github" && (
              <div className="flex-1 p-6 overflow-y-auto max-w-3xl mx-auto h-full">
                <div className="glass-panel border border-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <GitBranch className="h-4 w-4 text-indigo-400" /> Similar GitHub Repositories
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Find similar open source codebases to use as architecture inspiration and reference implementations.
                      </p>
                    </div>
                    <button
                      onClick={handleFindGithub}
                      disabled={searchingGithub}
                      className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1"
                    >
                      {searchingGithub ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                      Search GitHub
                    </button>
                  </div>

                  {githubReport ? (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {githubReport}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-slate-500 italic">
                      Click the button above to let AI search GitHub references matching your project scope.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
