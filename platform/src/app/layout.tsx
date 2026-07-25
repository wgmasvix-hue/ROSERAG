import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChengetAI Labs — AI Research Intelligence for DARE",
  description:
    "The AI intelligence layer on top of the DARE Institutional Repository (dspace.dare.co.zw). Ask questions, get cited answers, build research notebooks — powered by DSpace 8.1.",
  keywords: ["ChengetAI", "DARE repository", "DSpace", "RAG", "AI research", "institutional repository", "Zimbabwe"],
  openGraph: {
    title: "ChengetAI Labs — AI Research Intelligence for DARE",
    description: "AI-powered discovery for the DARE Institutional Repository · dspace.dare.co.zw",
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
