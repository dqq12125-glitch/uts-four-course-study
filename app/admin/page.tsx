import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getAdminService,
  getFeatureFlagService,
} from "@/src/application/runtime";
import {
  FeatureFlagToggle,
  CreatePublicQuestionForm,
  CreateTemplateForm,
  QuestionReviewControl,
  RunJobsButton,
  TemplateAdminForm,
  UserStatusControl,
} from "./admin-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin" };

interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  onboardingCompletedAt: string | null;
  createdAt: string;
  isPaid: number | boolean;
}

interface TemplateRow {
  id: string;
  courseCode: string | null;
  courseName: string;
  description: string | null;
  defaultLanguage: "zh-CN" | "en";
  isActive: number | boolean;
}

interface QuestionRow {
  id: string;
  difficulty: number;
  prompt: string;
  language: string;
  sourceType: string;
  reviewStatus: "draft" | "reviewed" | "rejected";
}

interface PaymentRow {
  id: string;
  email: string;
  productKey: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface ErrorRow {
  source: string;
  code: string;
  count: number;
  lastSeenAt: string;
}

function percent(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export default async function AdminPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (user.role !== "admin") notFound();
  if (!(await getFeatureFlagService().enabled("admin_dashboard_enabled"))) {
    notFound();
  }
  const dashboard = await getAdminService().dashboard();
  const users = dashboard.users as AdminUserRow[];
  const templates = dashboard.courseTemplates as unknown as TemplateRow[];
  const questions = dashboard.questions as unknown as QuestionRow[];
  const payments = dashboard.payments as unknown as PaymentRow[];
  const errors = dashboard.errors as unknown as ErrorRow[];
  const metrics = dashboard.metrics;
  const plainTemplates = templates.map((template) => ({
    id: template.id,
    courseCode: template.courseCode,
    courseName: template.courseName,
    description: template.description,
    defaultLanguage: template.defaultLanguage,
    isActive: template.isActive,
  }));

  const metricCards = [
    ["总用户", metrics.totalUsers],
    ["近 7 日新增", metrics.newUsers7d],
    ["Onboarding 完成率", percent(metrics.onboardingRate)],
    ["7 日活跃用户", metrics.activeUsers7d],
    ["28 日活跃用户", metrics.activeUsers28d],
    ["付费用户", metrics.paidUsers],
    ["Free → 付费", percent(metrics.freeToPaidRate)],
    [
      "确认收入",
      new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
      }).format(metrics.revenueMinorAud / 100),
    ],
    ["AI 成功调用", metrics.aiCalls],
    ["AI 成本估算", `${metrics.aiCostMinorUsd}¢ USD`],
    ["近 7 日完成任务", metrics.completedTasks7d],
    ["近 7 日练习", metrics.completedPractice7d],
    ["近 7 日复测", metrics.completedReviews7d],
    ["复测完成率", percent(metrics.reviewCompletionRate)],
    ["付费用户 7 日活跃率", percent(metrics.paidActiveRate)],
    [
      "每活跃用户 AI 成本",
      `${metrics.aiCostPerActiveUserMinorUsd.toFixed(2)}¢ USD`,
    ],
    ["退款率", percent(metrics.refundRate)],
  ] as const;

  return (
    <main className="saas-admin">
      <header className="saas-admin-header">
        <div>
          <p className="saas-eyebrow">Operational metadata only</p>
          <h1>DeepStudy Admin</h1>
          <p>
            默认不展示私人上传资料、提取全文或完整 AI 对话。
          </p>
        </div>
        <div className="saas-inline-actions">
          <RunJobsButton />
          <Link className="saas-button saas-button-secondary" href="/app/today">
            返回应用
          </Link>
        </div>
      </header>

      <section className="saas-admin-metrics" aria-label="关键指标">
        {metricCards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Environment flags</p>
          <h2>Feature Flags</h2>
        </div>
        <div className="saas-admin-list">
          {dashboard.featureFlags.map((flag) => (
            <article key={flag.key}>
              <div>
                <strong>{flag.key}</strong>
                <span>{flag.source}</span>
              </div>
              <FeatureFlagToggle
                flagKey={flag.key}
                initialEnabled={flag.enabled}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Accounts</p>
          <h2>最近用户</h2>
        </div>
        <div className="saas-admin-table-wrap">
          <table className="saas-admin-table">
            <thead>
              <tr>
                <th>用户</th>
                <th>Onboarding</th>
                <th>付费</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.displayName || account.email}</strong>
                    <small>{account.email}</small>
                  </td>
                  <td>{account.onboardingCompletedAt ? "完成" : "未完成"}</td>
                  <td>{Boolean(account.isPaid) ? "是" : "否"}</td>
                  <td>{account.status}</td>
                  <td>
                    {account.role === "student" ? (
                      <UserStatusControl
                        userId={account.id}
                        currentStatus={
                          account.status as "active" | "suspended"
                        }
                      />
                    ) : (
                      "Admin"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Reusable starting points</p>
          <h2>课程模板</h2>
        </div>
        <CreateTemplateForm />
        <div className="saas-admin-form-list">
          {plainTemplates.map((template) => (
            <TemplateAdminForm key={template.id} template={template} />
          ))}
        </div>
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Original public questions only</p>
          <h2>题目审核</h2>
        </div>
        {plainTemplates.length ? (
          <CreatePublicQuestionForm templates={plainTemplates} />
        ) : null}
        <div className="saas-admin-list">
          {questions.length ? (
            questions.map((question) => (
              <article key={question.id}>
                <div>
                  <strong>
                    难度 {question.difficulty} · {question.language}
                  </strong>
                  <span>{question.prompt}</span>
                </div>
                <QuestionReviewControl
                  questionId={question.id}
                  currentStatus={question.reviewStatus}
                />
              </article>
            ))
          ) : (
            <p className="saas-muted">没有公共题目等待审核。</p>
          )}
        </div>
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Commerce</p>
          <h2>最近支付</h2>
        </div>
        <div className="saas-admin-list">
          {payments.length ? (
            payments.map((payment) => (
              <article key={payment.id}>
                <div>
                  <strong>
                    {payment.productKey} · {payment.status}
                  </strong>
                  <span>
                    {payment.email} · {payment.amountMinor / 100}{" "}
                    {payment.currency.toUpperCase()}
                  </span>
                </div>
                <time dateTime={payment.createdAt}>
                  {new Intl.DateTimeFormat("en-AU", {
                    dateStyle: "medium",
                  }).format(new Date(payment.createdAt))}
                </time>
              </article>
            ))
          ) : (
            <p className="saas-muted">没有支付记录。</p>
          )}
        </div>
      </section>

      <section className="saas-card saas-admin-section">
        <div>
          <p className="saas-eyebrow">Safe error summaries</p>
          <h2>错误摘要</h2>
        </div>
        <div className="saas-admin-list">
          {errors.length ? (
            errors.map((error) => (
              <article key={`${error.source}-${error.code}`}>
                <div>
                  <strong>{error.code}</strong>
                  <span>{error.source}</span>
                </div>
                <span>{error.count} 次</span>
              </article>
            ))
          ) : (
            <p className="saas-muted">没有已记录的后台错误。</p>
          )}
        </div>
      </section>
    </main>
  );
}
