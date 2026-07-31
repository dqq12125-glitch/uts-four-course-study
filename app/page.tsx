import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeepStudy — 打开应用，就知道今天学什么",
  description:
    "把任意课程、截止日期和学习资料转化为每天可执行的学习任务，并通过原创练习和间隔复测检验掌握。",
};

export default async function MarketingHomePage() {
  const appHref = "/auth/sign-up";

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="marketing-wordmark" href="/">
          DeepStudy
        </Link>
        <nav aria-label="公共导航">
          <a href="#how-it-works">工作方式</a>
          <a href="#pricing">价格</a>
          <Link href="/auth/sign-in">登录</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="marketing-kicker">Semester execution system</p>
          <h1>打开应用，<br />就知道今天学什么。</h1>
          <p className="marketing-subtitle">
            DeepStudy 把课程、截止日期和学习资料转化成每天可执行的学习计划，并通过原创练习和间隔复测帮助你真正掌握。
          </p>
          <p className="marketing-english">
            Turn your semester into today&apos;s next step.
          </p>
          <div className="marketing-actions">
            <Link className="marketing-primary" href={appHref}>
              免费开始
            </Link>
            <a className="marketing-secondary" href="#demo">
              查看演示
            </a>
          </div>
        </div>
        <div className="marketing-today-card" aria-label="今日任务示例">
          <div className="marketing-card-topline">
            <span>Today · Week 4</span>
            <span>45 min</span>
          </div>
          <p className="marketing-course">OPEN COURSE · VECTOR METHODS</p>
          <h2>先完成今天最重要的一步</h2>
          <p>
            不看笔记写出向量投影公式，完成两道基础题，并用一句话解释投影方向。
          </p>
          <dl>
            <div>
              <dt>为什么现在做</dt>
              <dd>相关 workshop 在今晚；当前掌握度正在建立。</dd>
            </div>
            <div>
              <dt>完成标准</dt>
              <dd>2/2 独立正确，并能解释方向。</dd>
            </div>
          </dl>
          <button type="button" disabled>
            开始 25 分钟专注
          </button>
          <small>示例界面，不代表真实用户数据</small>
        </div>
      </section>

      <section
        className="marketing-values"
        id="how-it-works"
        aria-labelledby="values-title"
      >
        <div className="marketing-section-heading">
          <p>One loop, every day</p>
          <h2 id="values-title">不是聊天窗口，是可执行的学习闭环。</h2>
        </div>
        <div className="marketing-value-grid">
          <article>
            <span>01</span>
            <h3>自动整理学期</h3>
            <p>
              添加任意学校、任意课程、课表和截止日期。模板只是起点，不限制学科。
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>生成今天的下一步</h3>
            <p>
              首页只突出一项当前任务，说明预计时间、推荐原因和可验证的完成标准。
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>检查是否真正掌握</h3>
            <p>
              依据独立正确、提示次数、用时和延迟复测表现更新掌握度，不接受“我会了”作为证据。
            </p>
          </article>
        </div>
      </section>

      <section className="marketing-demo" id="demo">
        <div className="marketing-section-heading">
          <p>From plan to evidence</p>
          <h2>今天完成，不等于两天后还记得。</h2>
        </div>
        <div className="marketing-demo-grid">
          <article className="marketing-demo-task">
            <span>当前任务</span>
            <strong>复习函数参数与数组边界</strong>
            <small>预计 25 分钟 · 完成 2 道原创题</small>
          </article>
          <div className="marketing-demo-arrow" aria-hidden="true">→</div>
          <article className="marketing-demo-practice">
            <span>独立练习</span>
            <strong>错误类型：logic</strong>
            <small>使用 1 次提示 · 安排更早复习</small>
          </article>
          <div className="marketing-demo-arrow" aria-hidden="true">→</div>
          <article className="marketing-demo-review">
            <span>48 小时复测</span>
            <strong>延迟提取成功</strong>
            <small>下一间隔延长到 4 天</small>
          </article>
        </div>
        <div className="marketing-mastery-line">
          <div>
            <span>正在建立</span>
            <strong>不是虚假精确的 42.7%</strong>
          </div>
          <div>
            <span>最近进步</span>
            <strong>独立正确次数 +2</strong>
          </div>
          <div>
            <span>下一步</span>
            <strong>周四复测</strong>
          </div>
        </div>
      </section>

      <section className="marketing-audience">
        <p className="marketing-kicker">Built for demanding first years</p>
        <h2>为工程、数学、计算机和理科学生设计。</h2>
        <p>
          尤其适合一年级、国际学生、英语非母语学生，以及需要中英文双语解释的学习者。第一阶段以 UTS Spring
          2026 为优先模板，但任何课程都可以手动创建。
        </p>
      </section>

      <section
        className="marketing-pricing"
        id="pricing"
        aria-labelledby="pricing-title"
      >
        <div className="marketing-section-heading">
          <p>Founding semester</p>
          <h2 id="pricing-title">先免费验证价值，再决定是否解锁完整学期。</h2>
        </div>
        <div className="marketing-price-grid">
          <article>
            <span>Free</span>
            <h3>A$0</h3>
            <p>1 门课程、基础今日计划、有限练习和 AI 导师额度。</p>
            <Link href={appHref}>免费开始</Link>
          </article>
          <article className="is-featured">
            <span>Spring 2026 Founding Pass</span>
            <h3>A$19</h3>
            <p>
              一次性支付；最多 4 门课程、资料上传、原创练习、复测、周报与合理使用 AI 额度。
            </p>
            <Link href="/pricing">查看完整价格与购买</Link>
          </article>
        </div>
      </section>

      <section className="marketing-integrity">
        <div>
          <p className="marketing-kicker">Academic Integrity</p>
          <h2>帮助你学会，不替你提交。</h2>
        </div>
        <p>
          DeepStudy 用于学习规划、概念理解和原创练习，不替代学生完成需要独立提交的评估任务。AI
          导师默认 Hint-first；疑似正在评分的题目只提供概念、方向和不同的原创练习。
        </p>
      </section>

      <footer className="marketing-footer">
        <div>
          <strong>DeepStudy</strong>
          <p>
            DeepStudy is an independent student-built service. It is not
            affiliated with, sponsored by or endorsed by UTS.
          </p>
        </div>
        <nav aria-label="法律链接">
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/academic-integrity">
            Academic Integrity
          </Link>
        </nav>
      </footer>
    </main>
  );
}
