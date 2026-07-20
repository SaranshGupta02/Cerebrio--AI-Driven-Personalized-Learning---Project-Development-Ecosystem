import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cerebrio: AI-Driven Personalized Learning & Project Development Ecosystem",
  description: "Accelerate your learning and software development path with Cerebrio AI Assistant, powered by Agno and OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#030712] text-[#f3f4f6] selection:bg-indigo-500 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}
