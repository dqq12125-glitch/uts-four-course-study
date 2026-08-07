# Milestone 1 文件级实施计划

> 范围：开放课程 SaaS 基础  
> 原则：小范围、可回滚、旧四课页面继续可用

## 1. 预计修改

### 配置和依赖

* `.openai/hosting.json` — 启用 logical D1 binding `DB`
* `.env.example` — 增加 app、邮件和安全变量占位
* `package.json` / `package-lock.json` — 增加 schema validation，补测试脚本
* `cloudflare-env.d.ts` — 对齐 DB 和 runtime vars

### 数据库

* `db/schema.ts` — Milestone 1 表、约束和 index
* `drizzle/*.sql` — 可审查 migration 和幂等模板 seed
* `db/index.ts` — 保持单一 D1 获取入口

### 基础设施

* `src/lib/api-errors.ts`
* `src/lib/request-id.ts`
* `src/lib/validation.ts`
* `src/lib/timezone.ts`
* `src/lib/ids.ts`
* `src/lib/cookies.ts`

### 认证

* `src/application/auth-service.ts`
* `src/repositories/auth-repository.ts`
* `src/services/email/email-sender.ts`
* `src/services/email/resend-sender.ts`
* `app/api/auth/request-link/route.ts`
* `app/api/auth/sign-out/route.ts`
* `app/auth/sign-in/page.tsx`
* `app/auth/sign-up/page.tsx`
* `app/auth/verify/page.tsx`
* `app/auth/forgot-password/page.tsx`
* `app/auth/reset-password/page.tsx`

### 用户课程和计划

* `src/repositories/learning-repository.ts`
* `src/application/onboarding-service.ts`
* `src/application/course-service.ts`
* `src/application/assessment-service.ts`
* `src/domain/planning/plan-generator.ts`
* `src/domain/planning/task-priority.ts`
* `app/api/onboarding/route.ts`
* `app/api/course-templates/route.ts`
* `app/api/courses/route.ts`
* `app/api/courses/[courseId]/route.ts`
* `app/api/assessments/route.ts`
* `app/api/assessments/[assessmentId]/route.ts`
* `app/api/study-tasks/status/route.ts`

### 页面

* `app/onboarding/page.tsx`
* `app/onboarding/onboarding-wizard.tsx`
* `app/app/layout.tsx`
* `app/app/today/page.tsx`
* `app/app/today/today-client.tsx`
* `app/app/courses/page.tsx`
* `app/app/courses/courses-client.tsx`
* `app/app/courses/[courseId]/page.tsx`
* `app/saas.css`

### 测试

* `tests/helpers/d1-test-db.mjs`
* `tests/database-migration.test.mjs`
* `tests/auth-service.test.mjs`
* `tests/open-course-onboarding.test.mjs`
* `tests/data-isolation.test.mjs`
* `tests/planning.test.mjs`
* `tests/timezone.test.mjs`

## 2. 验收切片

### A. 任意课程

创建无模板课程并能读取、更新、归档；课程代码可为空。

### B. 模板可选

选择 33130 模板可以快速创建课程，但没有模板时流程不受阻。

### C. 隔离

用户 A 创建的 semester、course、assessment、task，用户 B 的读写 API/repository 均不可访问。

### D. 动态 Today

Onboarding 完成后 Today 只展示当前用户数据库中的一项主任务和最多两项候选任务。

### E. Auth

Magic link 单次、过期安全；session cookie 为 HttpOnly/Secure/SameSite；未登录无法访问 `/app/*`。

## 3. 明确不在本里程碑实现

* Stripe 和 entitlement 限制
* 文件上传/R2
* AI provider 全量重构
* mastery 0–100 和复测策略
* 管理后台
* 营销首页替换
* 生产邮件域名配置
