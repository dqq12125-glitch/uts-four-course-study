import PersonalFourCourseApp from "@/app/personal/four-course-app";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function PersonalPage() {
  const language = await getPublicLocale();
  return <PersonalFourCourseApp initialLocale={language} />;
}
