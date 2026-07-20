import Link from "next/link";
import { Sparkles, BarChart2, BookOpen, Layers } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            Cerebrio
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <BarChart2 className="h-4 w-4 text-indigo-400" />
            Dashboard
          </Link>
          <Link
            href="/project-assistant"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Layers className="h-4 w-4 text-emerald-400" />
            Project Assistant
          </Link>
          <Link
            href="/learning-system"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <BookOpen className="h-4 w-4 text-amber-400" />
            Learning System
          </Link>
        </nav>
      </div>
    </header>
  );
}
