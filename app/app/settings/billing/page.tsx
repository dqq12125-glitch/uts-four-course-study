import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getBillingService } from "@/src/application/runtime";
import { CheckoutButton } from "@/app/pricing/checkout-button";
import { BillingPortalButton } from "./portal-button";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "套餐与购买" };

function aud(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);
}

export default async function BillingPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const overview = await getBillingService().overview(user.id, user.role);
  const founding = overview.products.find(
    (product) => product.key === "founding_pass",
  );

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{t("账户", "Account")}</p>
        <h1>{t("套餐与购买", "Plans and purchases")}</h1>
        <p className="saas-lead">
          {t("当前方案：", "Current plan:")}
          <strong>
            {" "}
            {overview.entitlement.planKey === "free"
              ? t("免费版", "Free")
              : overview.entitlement.planKey}
          </strong>
          {overview.entitlement.isFoundingUser
            ? ` · ${t("创始用户", "Founding user")}`
            : ""}
        </p>
      </section>

      <section className="saas-card saas-billing-summary">
        <div>
          <span>{t("活跃课程额度", "Active course limit")}</span>
          <strong>{overview.entitlement.courseLimit}</strong>
        </div>
        <div>
          <span>{t("每日 AI 导师消息", "Daily AI tutor messages")}</span>
          <strong>{overview.entitlement.dailyAiMessageLimit}</strong>
        </div>
        <div>
          <span>{t("私人资料上传", "Private resource uploads")}</span>
          <strong>
            {overview.entitlement.canUploadResource
              ? t("已解锁", "Available")
              : t("未解锁", "Unavailable")}
          </strong>
        </div>
      </section>

      {founding?.available &&
      !overview.entitlement.activeProducts.includes("founding_pass") ? (
        <section className="saas-card saas-upgrade-card">
          <div>
            <p className="saas-eyebrow">{t("2026 年春季", "Spring 2026")}</p>
            <h2>
              {aud(founding.amountMinor, founding.currency)} {t("创始学期通行证", "Founding Pass")}
            </h2>
            <p>
              {t(
                "一次性购买，最多添加四门开放式课程。",
                "One-time purchase with up to four open courses.",
              )}
            </p>
          </div>
          <CheckoutButton
            productKey="founding_pass"
            language={user.preferredLanguage}
          >
            {t("前往安全支付", "Continue to secure checkout")}
          </CheckoutButton>
        </section>
      ) : null}

      <section className="saas-card">
        <header className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">{t("记录", "History")}</p>
            <h2>{t("购买记录", "Purchase history")}</h2>
          </div>
        </header>
        {overview.purchases.length ? (
          <div className="saas-purchase-list">
            {overview.purchases.map((purchase) => (
              <article key={purchase.id}>
                <div>
                  <strong>{purchase.productKey}</strong>
                  <span>{aud(purchase.amountMinor, purchase.currency)}</span>
                </div>
                <div>
                  <span>{purchase.status}</span>
                  <time dateTime={purchase.createdAt}>
                    {new Intl.DateTimeFormat(locale(user.preferredLanguage), {
                      dateStyle: "medium",
                    }).format(new Date(purchase.createdAt))}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="saas-muted">
            {t("还没有购买记录。", "No purchases yet.")}
          </p>
        )}
      </section>

      <div className="saas-inline-actions">
        <BillingPortalButton language={user.preferredLanguage} />
        <Link className="saas-button saas-button-secondary" href="/pricing">
          {t("查看公开价格", "View public pricing")}
        </Link>
      </div>
    </div>
  );
}
