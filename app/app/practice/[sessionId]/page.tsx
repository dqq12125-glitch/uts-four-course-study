import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getLearningLoopService } from "@/src/application/runtime";
import { PracticeRunner } from "@/app/app/practice/[sessionId]/practice-runner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "独立练习" };

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const { sessionId } = await params;
  const session = await getLearningLoopService().getPracticeSession(
    user.id,
    sessionId,
  );
  if (session.status !== "active") redirect("/app/mastery");

  return (
    <div className="saas-page saas-practice-page">
      <aside className="saas-integrity-note">
        <strong>Hint-first</strong>
        <span>先写出自己的判断；卡住时只展开一个最小提示。</span>
      </aside>
      <PracticeRunner
        session={session}
        timezone={user.timezone}
        language={user.preferredLanguage}
      />
    </div>
  );
}
