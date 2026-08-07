import Link from "next/link";
import type { Metadata } from "next";
import { AnalyticsEvent } from "@/app/analytics-event";
import { PublicFooter, PublicHeader } from "@/app/public-site-chrome";
import { CheckoutButton } from "@/app/pricing/checkout-button";
import { getPublicLocale } from "@/src/application/public-locale";
import { currentUserFromCookies } from "@/src/application/session";
import { PRODUCT_CATALOG } from "@/src/domain/commerce/products";

export const dynamic = "force-dynamic";

const pricingCopy = {
  "zh-CN": {
    title: "价格",
    description: "免费开始，或解锁完整的创始学期通行证。",
    label: "简单、透明的学期方案",
    heading: "先免费建立学习闭环，需要时再扩展。",
    lead: "一次选择覆盖一个学期。价格由服务端确认，不会接受浏览器传入的任意金额。",
    planLabel: "学习方案",
    free: "免费版",
    freeDescription: "用一门课程体验从计划到复测的完整闭环。",
    freeItems: [
      "一个活跃学期与一门课程",
      "基础今日计划与掌握状态",
      "每周有限原创练习",
      "每日有限 AI 导师消息",
    ],
    freeAction: "免费开始",
    pass: "创始学期通行证",
    passDescription: "一次性支付，使用到 2026 年春季学期结束。",
    passItems: [
      "最多四门任意课程",
      "每日计划、课表与专注计时",
      "原创练习、错因记录与 48 小时复测",
      "资料处理、周报与合理使用的 AI 额度",
    ],
    buy: "购买通行证",
    registerBuy: "注册并购买",
    integrity: "学术诚信",
    integrityBody:
      "DeepStudy 用于学习规划、概念理解和原创练习，不替代学生完成需要独立提交的考核任务。",
  },
  en: {
    title: "Pricing",
    description: "Start free or unlock the complete Founding Semester Pass.",
    label: "Simple semester access",
    heading: "Build the learning loop for free. Expand only when it helps.",
    lead: "One decision covers a semester. Prices are confirmed by the server and never accepted from a browser-supplied amount.",
    planLabel: "Study plans",
    free: "Free",
    freeDescription: "Experience the complete plan-to-retest loop with one course.",
    freeItems: [
      "One active semester and one course",
      "Basic daily planning and mastery states",
      "Limited original practice each week",
      "Limited AI tutor messages each day",
    ],
    freeAction: "Start free",
    pass: "Founding Semester Pass",
    passDescription: "One payment for access through the end of Spring 2026.",
    passItems: [
      "Up to four courses from any subject",
      "Daily plans, timetable and focus timer",
      "Original practice, error tracking and 48-hour retests",
      "Resource processing, weekly reports and fair-use AI capacity",
    ],
    buy: "Buy the pass",
    registerBuy: "Create account and buy",
    integrity: "Academic integrity",
    integrityBody:
      "DeepStudy supports planning, concept learning and original practice. It does not replace work that a student must submit independently.",
  },
} as const;

function aud(amountMinor: number, language: "zh-CN" | "en"): string {
  const amount = amountMinor / 100;
  return `A$${new Intl.NumberFormat(
    language === "zh-CN" ? "zh-CN" : "en-AU",
    {
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    },
  ).format(amount)}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  const content = pricingCopy[language];
  return { title: content.title, description: content.description };
}

export default async function PricingPage() {
  const [user, language] = await Promise.all([
    currentUserFromCookies(),
    getPublicLocale(),
  ]);
  const content = pricingCopy[language];
  const founding = PRODUCT_CATALOG.founding_pass;

  return (
    <div className="public-site public-pricing-page">
      {user ? <AnalyticsEvent eventName="paywall_viewed" /> : null}
      <PublicHeader language={language} signedIn={Boolean(user)} />
      <main>
        <section className="pricing-hero">
          <p className="public-section-label">{content.label}</p>
          <h1>{content.heading}</h1>
          <p>{content.lead}</p>
        </section>

        <section className="pricing-plans" aria-label={content.planLabel}>
          <article className="pricing-plan">
            <header>
              <p>{content.free}</p>
              <h2>A$0</h2>
              <span>{content.freeDescription}</span>
            </header>
            <ul>
              {content.freeItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <Link
              className="public-button public-button-secondary"
              href={user ? "/app/today" : "/auth/sign-up"}
            >
              {content.freeAction}
            </Link>
          </article>

          <article className="pricing-plan pricing-plan-featured">
            <header>
              <p>{content.pass}</p>
              <h2>{aud(founding.amountMinor, language)}</h2>
              <span>{content.passDescription}</span>
            </header>
            <ul>
              {content.passItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
            {user ? (
              <CheckoutButton productKey="founding_pass" language={language}>
                {content.buy}
              </CheckoutButton>
            ) : (
              <Link
                className="public-button public-button-primary"
                href="/auth/sign-up?next=/pricing"
              >
                {content.registerBuy}
              </Link>
            )}
          </article>
        </section>

        <aside className="pricing-integrity">
          <h2>{content.integrity}</h2>
          <p>{content.integrityBody}</p>
        </aside>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
