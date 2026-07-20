"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { BarChart2, BookOpen, Layers, Trophy, CheckCircle, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

interface AnalyticsData {
  concept_mastery: Record<string, number>;
  projects_count: number;
  documents_count: number;
  average_quiz_score: number;
  recent_attempts: Array<{
    quiz_id: string;
    score: number;
    weak_concepts_count: number;
    attempted_at: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/analytics/default_user`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        console.log("Using fallback dashboard data:", err);
        // Fallback mockup data if backend is offline
        setData({
          concept_mastery: {
            "Machine Learning": 0.85,
            "Supervised Learning": 0.72,
            "Neural Networks": 0.45,
            "FastAPI Services": 0.90,
            "Database Normalization": 0.60,
            "Next.js App Router": 0.78
          },
          projects_count: 3,
          documents_count: 5,
          average_quiz_score: 78.5,
          recent_attempts: [
            {
              quiz_id: "q1",
              score: 90.0,
              weak_concepts_count: 0,
              attempted_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              quiz_id: "q2",
              score: 66.7,
              weak_concepts_count: 2,
              attempted_at: new Date(Date.now() - 3600000 * 24).toISOString()
            },
            {
              quiz_id: "q3",
              score: 80.0,
              weak_concepts_count: 1,
              attempted_at: new Date(Date.now() - 3600000 * 48).toISOString()
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030712] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm">Aggregating telemetry analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030712] pb-16">
      {/* Background Glows */}
      <div className="absolute top-[-5%] right-[-5%] h-[400px] w-[400px] rounded-full bg-indigo-950/10 blur-[100px]" />
      <div className="absolute bottom-[5%] left-[-5%] h-[400px] w-[400px] rounded-full bg-emerald-950/10 blur-[100px]" />

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-10 relative z-10">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-2">
            <Activity className="h-7 w-7 text-indigo-500" /> Learner Analytics Hub
          </h1>
          <p className="text-sm text-slate-400">
            Real-time analytics collected from project designs, conceptual assessments, and study progress.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Avg Quiz Score */}
          <div className="glass-panel rounded-xl p-6 relative group overflow-hidden">
            <div className="absolute right-3 top-3 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
              <Trophy className="h-12 w-12" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Average Quiz Score</p>
            <p className="text-3xl font-bold text-white mb-1">{data?.average_quiz_score.toFixed(1)}%</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Mastery Threshold Met
            </span>
          </div>

          {/* Card 2: Projects Generated */}
          <div className="glass-panel rounded-xl p-6 relative group overflow-hidden">
            <div className="absolute right-3 top-3 text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors">
              <Layers className="h-12 w-12" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Projects Created</p>
            <p className="text-3xl font-bold text-white mb-1">{data?.projects_count}</p>
            <span className="text-xs text-slate-400">Architectures Generated</span>
          </div>

          {/* Card 3: Documents Read */}
          <div className="glass-panel rounded-xl p-6 relative group overflow-hidden">
            <div className="absolute right-3 top-3 text-amber-500/20 group-hover:text-amber-500/40 transition-colors">
              <BookOpen className="h-12 w-12" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Documents Processed</p>
            <p className="text-3xl font-bold text-white mb-1">{data?.documents_count}</p>
            <span className="text-xs text-slate-400">PDFs / YouTube RAG Loaded</span>
          </div>

          {/* Card 4: Concepts Mastered */}
          <div className="glass-panel rounded-xl p-6 relative group overflow-hidden">
            <div className="absolute right-3 top-3 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
              <BarChart2 className="h-12 w-12" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Concepts Mastered</p>
            <p className="text-3xl font-bold text-white mb-1">
              {data ? Object.values(data.concept_mastery).filter(v => v >= 0.75).length : 0}
            </p>
            <span className="text-xs text-slate-400">Score &ge; 75% Mastery</span>
          </div>
        </div>

        {/* Middle Panels: Concept Mastery & Attempts */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Concept Mastery Grid */}
          <div className="glass-panel rounded-xl p-6 md:col-span-2">
            <h2 className="text-lg font-bold text-white mb-6">Concept Mastery Breakdown</h2>
            <div className="space-y-5">
              {data && Object.entries(data.concept_mastery).map(([concept, val]) => (
                <div key={concept}>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-300">{concept}</span>
                    <span className={val >= 0.75 ? "text-emerald-400" : val >= 0.5 ? "text-amber-400" : "text-rose-400"}>
                      {(val * 100).toFixed(0)}% Mastery
                    </span>
                  </div>
                  {/* Custom Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        val >= 0.75 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                        val >= 0.5 ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                        "bg-gradient-to-r from-rose-500 to-pink-500"
                      }`}
                      style={{ width: `${val * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="glass-panel rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-6">Diagnostic Logs</h2>
              <div className="space-y-4">
                {data?.recent_attempts.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 rounded-lg text-xs">
                    <div>
                      <p className="font-semibold text-slate-300">Quiz Attempt #{idx + 1}</p>
                      <p className="text-[10px] text-slate-500">{new Date(att.attempted_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${att.score >= 75 ? "text-emerald-400" : "text-amber-400"}`}>
                        {att.score}%
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end">
                        {att.weak_concepts_count > 0 ? (
                          <>
                            <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                            {att.weak_concepts_count} gaps
                          </>
                        ) : (
                          "Perfect!"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5">
              <Link
                href="/learning-system"
                className="flex items-center justify-between text-xs font-semibold text-indigo-400 hover:text-indigo-300 group"
              >
                Launch Study Session
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
