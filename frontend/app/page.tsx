import Navbar from "../components/Navbar";
import Link from "next/link";
import { Sparkles, Layers, BookOpen, ChevronRight, BarChart2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712]">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-900/10 blur-[120px] animate-pulse-slow"></div>

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-6">
            <Sparkles className="h-4 w-4" /> Powered by Agno & OpenAI
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Cerebrio Ecosystem
          </h1>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
            A unified AI-driven workspace that connects personalized concept learning with interactive project system design and software prototyping.
          </p>
        </div>

        {/* Modules Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Module 1: Project Assistant */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:border-emerald-500/20">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">AI Project Assistant</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Transform any software concept into a concrete, interactive architecture. Automatically generates Use Cases, Class diagrams, DB Schemas, sequences, structured codebase trees, and parses relevant GitHub repos.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Interactive React Flow UML Canvas
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Tailored Folder Structure Templates
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  GitHub Codebase Recommendations
                </li>
              </ul>
            </div>
            <Link
              href="/project-assistant"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 border border-emerald-500/20 transition-all hover:bg-emerald-500 hover:text-white"
            >
              Start Designing <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Module 2: Personalized Learning */}
          <div className="glass-panel rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:scale-[1.01] hover:border-indigo-500/20">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">AI Learning System</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Convert PDFs or YouTube lectures into active learning paths. Explores topics through interactive concept graphs, test comprehension with adaptive quizzes, and receive remedial lessons automatically.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Interactive clickable topic node trees
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Adaptive Multiple Choice & Theory Quizzes
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  RAG chatbot support for documents
                </li>
              </ul>
            </div>
            <Link
              href="/learning-system"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-400 border border-indigo-500/20 transition-all hover:bg-indigo-500 hover:text-white"
            >
              Start Learning <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Dashboard Link Panel */}
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-2xl glass-panel p-6 hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">View Your Learning Progress</h3>
                <p className="text-xs text-slate-400">Track concept masteries, active projects, and diagnostic reports.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              Go to Dashboard <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
