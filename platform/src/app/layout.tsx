import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoseRAG — AI Knowledge Operating System",
  description:
    "Transform documents, repositories, and institutional knowledge into trusted, evidence-based intelligence.",
  keywords: ["RAG", "knowledge management", "AI", "research", "library", "DSpace"],
  openGraph: {
    title: "RoseRAG — AI Knowledge Operating System",
    description: "Evidence-based AI for institutions, researchers, and libraries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
