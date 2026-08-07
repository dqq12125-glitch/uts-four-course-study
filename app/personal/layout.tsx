import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isPersonalOwner } from "@/src/application/personal-access";
import { getPublicLocale } from "@/src/application/public-locale";
import { currentUserFromCookies } from "@/src/application/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  return {
    title: language === "zh-CN" ? "四课随身学" : "Four-Course Study",
    description: language === "zh-CN"
      ? "面向四门 UTS 课程的个人学习、练习与掌握空间。"
      : "A personal study, practice and mastery workspace for four UTS courses.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PersonalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!isPersonalOwner(user.email)) notFound();

  return children;
}
