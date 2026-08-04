# DeepStudy Phase 1：基础架构实施记录

> 日期：2026-08-03（Australia/Sydney）
>
> 状态：代码与本地质量门禁完成；未开始 Phase 2
>
> 数据权威：现有 Web 继续使用 D1；没有切换公开部署或生产数据

## 1. 结果

Phase 1 已用兼容式迁移建立后续模块需要的公共边界，没有移动根目录
`app/`、没有删除现有功能，也没有实现 Connector、Course Brain 或
Learning Pack：

- 根仓库成为 npm workspace，只有一个权威 `package-lock.json`；
- Node 最低版本调整为 22.18，因为该版本开始默认启用测试所需的 TypeScript
  type stripping；
- Web 与 Expo 统一使用 React 19.2.8，避免原生 bundle 出现重复 React；Expo
  的 patch-version 校验对 `react/react-dom` 做显式例外，因为 React Native
  0.86 的 peer range 接受该版本，而 Vinext 需要 19.2.6 以上；
- Web 与 Expo 共享语言、用户、课程、来源引用、学习模式、AI Role、
  API response/error 及 Zod Schema；
- Expo 保留原 `DeepStudyApi` 类和类型导入路径，内部复用共享 transport；
- 建立供应商无关的 AI、能力级 model policy、版本化 prompt registry，
  并让现有结构化 AI 输出经过 Zod 最终验证；
- R2/内存对象存储迁到共享 package，现有 R2 key 和 private metadata 不变；
- 建立可执行的 inline Job Queue，覆盖 payload validation、retry 和完成后
  idempotency；旧上传仍保持同步，等待 Phase 2；
- 建立 PostgreSQL/pgvector 目标 Schema、两份有序 migration、HNSW 索引、
  D1 全表快照、校验 manifest、无损 staging import 和验证工具；
- 建立 AES-256-GCM、context-bound、可轮换的 Connector token 加密接口；
- 建立共享视觉 token 与五项主导航 contract，但不提前切换现有页面；
- Worker 统一增加非破坏性安全响应头，并对显式 production 配置 fail closed。

## 2. Workspace 边界

```text
packages/
  shared-types/   # DTO、枚举、Zod、SourceReference
  api-client/     # URL、Bearer、response/error transport
  ai/             # AIProvider、model policy、prompt、structured validation
  storage/        # ObjectStorage、R2、memory
  jobs/           # JobQueue、inline retry/idempotency adapter
  security/       # connector secret encryption/key rotation
  ui/             # semantic tokens/navigation contract
  database/       # PostgreSQL schema/migrations/D1 migration tools
  testkit/        # 跨端 contract fixtures
```

根 Web 保持原位。`apps/mobile/src/api/types.ts` 是迁移期兼容 re-export；尚未
共享的移动 DTO 会在相关领域迁移时逐步提取，不进行一次性大改。

## 3. 数据库与迁移

现有 `db/schema.ts` 和 `drizzle/` 没有修改，因此本 Phase 不需要 D1 migration。
新增 PostgreSQL migration 位于 `packages/database/migrations/`：

- 41 张业务/迁移表；
- `CREATE EXTENSION vector`；
- `resource_chunks.embedding vector(1536)`；
- cosine HNSW index；
- tenant/user ownership、source metadata、status、timestamps、soft delete；
- Resource version/hash/parser/embedding 状态；
- Course Brain、Session、Mastery、Planner、Tool Run、AI cost 与 audit 表族；
- `legacy_import_rows` 保留全部旧行，正常化前不丢失外围数据。

D1 导出脚本必须显式选择 `--local` 或 `--remote`，输出文件不能覆盖。导入
脚本在单一 PostgreSQL transaction 中写入 staging、owner hints、每行 checksum、
每表计数和 migration report；任一计数不一致会回滚。它目前不会把公开 Web
切到 PostgreSQL，也不会假装外围 legacy 行已经正常化。

## 4. 运行

```powershell
npm install
npm run db:migrate:local
npm run dev

npm run start --workspace @deepstudy/mobile
```

PostgreSQL target：

```powershell
npm run db:generate:postgres
npm run db:check:postgres
$env:POSTGRES_URL = "postgresql://..."
npm run db:migrate:postgres
npm run db:verify:postgres
```

D1 快照与 staging：

```powershell
npm run db:export:d1 -- --database=DB --output=./private/d1-snapshot.json --remote --config=wrangler.jsonc
$env:POSTGRES_URL = "postgresql://..."
npm run db:import:postgres -- --input=./private/d1-snapshot.json
```

## 5. 测试

```powershell
npm run typecheck
npm run lint
npm run test:contracts
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build

npm run typecheck:mobile
npm run lint:mobile
npm run test:mobile
```

PostgreSQL 的真实空库验收由 `.github/workflows/postgres-contract.yml` 在两个
独立 PostgreSQL 16 + pgvector 数据库执行。本机没有 Docker/psql，因此本次
本地运行的是 Drizzle consistency check 和 migration contract tests，不把它
描述成真实 PostgreSQL 连接成功。

## 6. 安全与配置

- 明文 Connector token 不进入数据库或日志；密文包含 version/key ID/nonce；
- AES-GCM additional authenticated data 绑定用户和 Connector context；
- 轮换时新 key 加密，旧 key 仅保留解密能力；
- 显式 `APP_ENV=production` 且不是 personal deployment 时，HTTPS base URL、
  D1/R2、邮件配置和 32 字符以上的安全 secret 缺失会 fail closed；
- response headers 包含 nosniff、frame denial、referrer/permissions policy，
  production HTTPS 增加 HSTS；
- 没有启用会破坏现有 Vinext hydration 的强 CSP；CSP nonce 需在后续单独实施。

## 7. 已知限制与 Phase 2 前置门

- 尚未选定托管 PostgreSQL、数据区域和首个生产 Queue Adapter；业务层不依赖
  这些供应商，选择可延后但 preview shadow read 前必须确定；
- 本机没有真实 PostgreSQL，需等待 CI 或 preview 环境完成 migration-from-empty；
- staging import 解决无损、ID、owner、计数和 checksum，旧 commerce/notification
  等外围表的正常化 backfill 仍需在 cutover 前完成；
- 现有 D1 Repository 尚未切换或双写，避免在迁移演练前制造不一致；
- `embed` 与 `transcribe` 是可替换接口，尚未在 Phase 1 触发实际课程处理；
- 新 navigation contract 未切换当前 Web/Expo 导航；页面重组按原计划在
  Mastery/Planner 与移动适配 Phase 完成。

下一步只能进入 Phase 2：Connector registry、Mock/Manual/Canvas 基础、版本化
Resource、增量同步、文档定位与来源引用；不能跳过 Phase 2 直接实现 Course Brain。

## 8. 本次验证结果

- `npm ci`：通过；workspace 可从单一 lockfile 重建；
- Web `typecheck` / `lint`：通过；
- Unit：47/47；Integration：17/17；HTTP/E2E：7/7；
- Web production build：通过；保留原有 `>500 kB` chunk warning；
- Contract tests：15/15；Drizzle PostgreSQL consistency check：通过；
- Expo typecheck / lint / tests：通过，测试 8/8；
- Expo Doctor：20/20；Android 与 iOS export 均成功；
- `git diff --check`：通过；
- `npm audit --omit=dev`：仍有 12 个 moderate advisory，来自 Expo
  prebuild/config 工具链中的旧 `uuid` 路径；自动修复要求 breaking downgrade，
  本 Phase 未使用 `--force`。应等待兼容的 Expo 上游修复或在独立依赖升级中验证。

本机没有 Docker/psql，所以没有声称真实 PostgreSQL migration 已在本地执行；
对应空库与 pgvector 验收已编码到 CI workflow，首次远端运行结果仍是发布门禁。
