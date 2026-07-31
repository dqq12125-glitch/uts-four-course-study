import Link from "next/link";
import type { Metadata } from "next";
import { currentUserFromCookies } from "@/src/application/session";
import { PRODUCT_CATALOG } from "@/src/domain/commerce/products";
import { CheckoutButton } from "@/app/pricing/checkout-button";
import { AnalyticsEvent } from "@/app/analytics-event";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start free or unlock the Spring 2026 Founding Pass for DeepStudy.",
};

function aud(amountMinor: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amountMinor / 100);
}

export default async function PricingPage() {
  const user = await currentUserFromCookies();
  const founding = PRODUCT_CATALOG.founding_pass;

  return (
    <main className="saas-public-page">
      {user ? <AnalyticsEvent eventName="paywall_viewed" /> : null}
      <header className="saas-public-header">
        <Link className="saas-wordmark" href="/">
          DeepStudy
        </Link>
        <nav aria-label="Account">
          <Link href={user ? "/app/today" : "/auth/sign-in"}>
            {user ? "返回应用" : "登录"}
          </Link>
        </nav>
      </header>

      <section className="saas-pricing-hero">
        <p className="saas-eyebrow">Simple semester access</p>
        <h1>先免费开始，需要时再解锁完整学期。</h1>
        <p>
          所有价格由服务端确认。DeepStudy 不会接受浏览器传入的任意金额。
        </p>
      </section>

      <section className="saas-pricing-grid" aria-label="Plans">
        <article className="saas-price-card">
          <p className="saas-eyebrow">Free</p>
          <h2>A$0</h2>
          <p>适合用一门开放式课程体验每日执行闭环。</p>
          <ul>
            <li>1 个活跃学期、1 门课程</li>
            <li>基础今日计划与掌握度</li>
            <li>每周有限练习</li>
            <li>每日有限 AI 导师消息</li>
          </ul>
          <Link
            className="saas-button saas-button-secondary"
            href={user ? "/app/today" : "/auth/sign-up"}
          >
            免费开始
          </Link>
        </article>

        <article className="saas-price-card is-featured">
          <p className="saas-eyebrow">Spring 2026 Founding Pass</p>
          <h2>{aud(founding.amountMinor)}</h2>
          <p>一次性支付，使用到 Spring 2026 学期结束。</p>
          <ul>
            <li>最多 4 门任意课程</li>
            <li>每日计划、课表、专注计时器</li>
            <li>原创练习、错题记录和 48 小时复测</li>
            <li>资料上传、合理使用 AI 额度与周报</li>
          </ul>
          {user ? (
            <CheckoutButton productKey="founding_pass">
              购买 Founding Pass
            </CheckoutButton>
          ) : (
            <Link
              className="saas-button saas-button-primary"
              href="/auth/sign-up?next=/pricing"
            >
              注册并购买
            </Link>
          )}
        </article>
      </section>

      <section className="saas-integrity-note">
        <h2>Academic Integrity</h2>
        <p>
          DeepStudy 用于学习规划、概念理解和原创练习，不替代学生完成需要独立提交的评估任务。
        </p>
      </section>
    </main>
  );
}
