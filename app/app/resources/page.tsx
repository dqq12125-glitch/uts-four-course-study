import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getEntitlementService,
  getLearningRepository,
  getResourceService,
} from "@/src/application/runtime";
import { ResourcesWorkspace } from "./resources-workspace";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "私人学习资料" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    courseId?: string;
    resourceType?: string;
  }>;
}) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const query = await searchParams;
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const [courses, resources, entitlement] = await Promise.all([
    getLearningRepository().listCourses(user.id),
    getResourceService().list(user.id),
    getEntitlementService().snapshot(user.id, user.role),
  ]);
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{t("私人学习资料", "Private resources")}</p>
        <h1>{t("学习资料", "Study resources")}</h1>
        <p className="saas-lead">
          {t(
            "上传文件先进入私人存储。系统只提出候选课程数据，必须由你确认后才会导入。",
            "Uploads go into private storage first. Extracted course data remains a proposal until you explicitly confirm it.",
          )}
        </p>
      </section>
      <ResourcesWorkspace
        canUpload={entitlement.canUploadResource}
        language={user.preferredLanguage}
        courses={courses.map((course) => ({
          id: course.id,
          courseName: course.courseName,
          courseCode: course.courseCode,
        }))}
        initialResources={resources.map((resource) => ({
          id: resource.id,
          courseId: resource.courseId,
          courseName: resource.courseName,
          fileName: resource.fileName,
          mimeType: resource.mimeType,
          fileSize: resource.fileSize,
          resourceType: resource.resourceType,
          processingStatus: resource.processingStatus,
          failureCode: resource.failureCode,
          createdAt: resource.createdAt,
          ingestion: resource.ingestion ?? null,
        }))}
        initialCourseId={query.courseId}
        initialResourceType={
          query.resourceType === "timetable"
            ? "timetable"
            : undefined
        }
      />
    </div>
  );
}
