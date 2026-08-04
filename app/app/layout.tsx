import { redirect } from "next/navigation";
import { isPersonalOwner } from "@/src/application/personal-access";
import { currentUserFromCookies } from "@/src/application/session";
import { ProductNavigation } from "@/app/app/product-navigation";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");

  return (
    <div
      className="saas-app"
      lang={user.preferredLanguage === "zh-CN" ? "zh-CN" : "en"}
    >
      <ProductNavigation
        language={user.preferredLanguage}
        displayName={user.displayName || user.email.split("@")[0]}
        email={user.email}
        personalOwner={isPersonalOwner(user.email)}
      />
      <main className="saas-app-main">{children}</main>
    </div>
  );
}
