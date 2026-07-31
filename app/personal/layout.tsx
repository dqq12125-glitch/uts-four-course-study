import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isPersonalOwner } from "@/src/application/personal-access";
import { currentUserFromCookies } from "@/src/application/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "个人四课学习空间",
  description: "Private legacy four-course study workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PersonalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!isPersonalOwner(user.email)) notFound();

  return children;
}
