import SubjectResearchClient from "./SubjectResearchClient";

// ─── Static generation (server component) ────────────────────────────────────

export function generateStaticParams() {
  return [
    "food-science",
    "agriculture",
    "climate-science",
    "health-sciences",
    "education",
    "engineering",
    "social-sciences",
    "economics",
  ].map((subject) => ({ subject }));
}

export default async function SubjectResearchPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  return <SubjectResearchClient subject={subject} />;
}
