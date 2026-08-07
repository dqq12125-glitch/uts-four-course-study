# DeepStudy Phase 2：课程导入与文档摄取实施记录

> 日期：2026-08-03（Australia/Sydney）
>
> 状态：代码与本地质量门禁完成；未开始 Phase 3
>
> 数据权威：现有 Web 继续使用 D1；PostgreSQL/pgvector 仍是 shadow target；未部署公开环境

## 1. 结果

Phase 2 在现有资源上传/确认功能内部建立了版本化摄取管线，没有删除
`learning_resources`、`resource_extractions`、`/api/resources` 或旧确认交互：

- 新增 `@deepstudy/ingestion` workspace，提供 Connector registry、统一
  `LMSConnector` contract、Mock、Manual Upload 和 Canvas 只读实现；
- Canvas 只调用 GET API，读取课程、作业、模块、公告、日历和课程文件，遵循
  Canvas `Link` header 的 opaque pagination，并限制分页来源不能离开配置的
  Canvas origin；
- Manual Upload 在保存前计算 SHA-256，相同用户、课程和文件 Hash 直接返回
  已有资源，不重复写 R2、legacy row、version、job 或 chunk；
- D1 增加 Resource、Version、Chunk、Processing Job、LMS Connection、Course Link
  和 Sync Run 表；旧资源表继续作为页面/API 的兼容 read model；
- 文档管线支持 PDF、PPTX、DOCX、XLSX、HTML、UTF-8 文本/Markdown/CSV、
  Jupyter Notebook、常见源代码和现有图片上传路径；
- PDF Chunk 保留页码，PPTX Chunk 保留幻灯片编号，其余文本 Chunk 保留
  section；数据库和共享 Zod contract 都拒绝无 locator 的来源；
- 配置 Embedding Provider 时按批生成向量；新版本按
  `contentHash + locator + embeddingVersion` 复用未变化 Chunk 的向量，只为变化
  Chunk 调用 Provider；未配置时明确记录 warning，不伪造向量；
- Job 持久化 attempt、idempotency key、状态和安全错误码；失败可重试，重试前
  清理该 version 的部分 Chunk，不产生重复写入；
- `POST /api/courses/:courseId/sync` 执行增量同步：`updatedAt` 未变则不下载，
  下载后 file Hash 未变则不创建版本，远端消失先 tombstone；
- 资源页面保留“候选数据确认”主流程，同时显示 pipeline/version/job、Chunk、
  Embedding、复用和质量状态；
- 资源/账户删除覆盖所有历史 version 对象，不只删除 legacy current key。

## 2. 运行数据流

```text
Manual / Mock / Canvas
→ metadata comparison
→ SHA-256 file hash
→ Resource + immutable ResourceVersion
→ persistent ProcessingJob claim
→ parser (page / slide / section units)
→ semantic chunks + content hash
→ reuse unchanged embeddings
→ embed changed chunks when configured
→ quality report
→ publish current version
→ legacy extraction proposal
→ explicit user confirmation
```

工作流由代码和数据库状态控制。Canvas token 只从 AES-GCM encrypted envelope
解密到 Connector 实例，不进入响应、同步详情或错误日志。Connector 不包含
提交作业、参加 Quiz 或 LMS 写操作。

## 3. Connector contract

共享 contract 位于 `packages/shared-types/src/ingestion.ts`，实现位于
`packages/ingestion/src/connectors/`。除用户给定的接口外，增加
`listResources`，让同步在下载前先比较远端 metadata。

Canvas 实现的保护边界：

- base URL 必须是 HTTPS（测试 localhost 例外）；
- Authorization header 只发送给配置的 Canvas origin；
- pagination next link 当作 opaque URL，但 origin 必须保持一致；
- 单次 endpoint 最多读取 100 页；
- 单门课程一次最多摄取 500 个资源；
- 所有返回 JSON 先经过 Zod，再进入同步服务。

运行时 Canvas connection 需要 D1 中已有 active `lms_connections` 和
`lms_course_links`，credential 字段保存 `EncryptedSecret`；Phase 2 没有提前实现
学校 OAuth/连接管理 UI。

## 4. 文档与引用

| 输入 | 当前定位 | 处理方式 |
| --- | --- | --- |
| PDF | `page` | `unpdf` 每页提取，最多 250 页 |
| PPTX | `slide` | Open XML slide 顺序与 `<a:t>` 文本 |
| DOCX | `section=Document` | Open XML paragraph text |
| XLSX | `section=Sheet N` | 基础 cell/shared-string 表格文本 |
| Markdown/Text/Code | Markdown heading 或 `Document` | UTF-8 与语义段落切块 |
| HTML | `section=Document` | 去除 script/style/tag 后切块 |
| Jupyter | `section=Cell N (type)` | markdown/code cell source |
| Image | 暂无文字 locator | 保留旧 Vision AI 路径；质量报告明确 OCR 未配置 |

每个可搜索 Chunk 保存 `resourceId`、`courseId`、locator、source URL、
content Hash、version、parser/embedding version。`SourceReference` 至少需要一个
page、slide、section 或完整 timestamp range；page 与 slide 不能同时存在。

## 5. 数据库迁移

D1 新 migration：

- `drizzle/0008_watery_dreadnoughts.sql`
- 新增 7 张表，总数由 35 增至 42：
  `lms_connections`、`lms_course_links`、`resources`、`resource_versions`、
  `resource_processing_jobs`、`resource_chunks`、`resource_sync_runs`。

PostgreSQL shadow target 新 migration：

- `packages/database/migrations/0002_dusty_goliath.sql`
- 增加 `resource_sync_runs`；补齐 legacy mapping、文件/对象、质量报告和
  Job max-attempt 字段；总表数由 41 增至 42。

所有变更都是 additive。旧 D1 表和 migration 没有改名或删除。远端部署前必须
先备份 D1，再应用 0008；兼容代码不能先于 migration 上线。

## 6. API 与 UI

保留：

- `GET/POST /api/resources`
- `GET/DELETE /api/resources/:resourceId`
- `POST /api/resources/:resourceId/process`
- `POST /api/resources/:resourceId/confirm`
- `GET /api/resources/:resourceId/download`

新增：

- `GET /api/resources/:resourceId/status`
- `POST /api/resources/:resourceId/reprocess`
- `POST /api/courses/:courseId/sync`

DTO 只新增可忽略的 `ingestion` 字段，旧客户端不需要同时升级。Storage key、
connector token 和 raw embedding 不进入普通资源 DTO。

## 7. 配置

Embedding 可选配置：

```text
AI_LOW_COST_MODEL
AI_MEDIUM_MODEL
AI_HIGH_CAPABILITY_MODEL
AI_EMBEDDING_MODEL
AI_EMBEDDING_VERSION
```

`AI_EMBEDDING_VERSION` 在模型、维度或归一化改变时必须递增。缺少
`AI_EMBEDDING_MODEL` 时仍完成解析/Chunk，并保存
`EMBEDDING_PROVIDER_NOT_CONFIGURED` warning。

Canvas credential envelope 使用 Phase 1 的：

```text
CONNECTOR_TOKEN_ACTIVE_KEY_ID
CONNECTOR_TOKEN_KEYS
```

AAD context 固定为 `lms:{userId}:{connectionId}`。密钥 JSON 的值是 32-byte key
的 Base64/Base64URL 编码。

## 8. 运行与测试

```powershell
npm install
npm run db:migrate:local
npm run dev

npm run typecheck
npm run lint
npm run test:contracts
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run db:check:postgres
```

Phase 2 增加：Connector contract/Canvas pagination、PDF/PPTX locator、Embedding
validation、Hash dedup、version diff/reuse、persistent retry、tombstone、sync log 和
HTTP status/dedup tests。

2026-08-03 本地验证结果：

- Web/backend typecheck 与 lint 通过；
- contract 20/20、unit 52/52、integration 21/21、HTTP E2E 8/8；
- `npm test` 全量构建及 112/112 tests 通过；
- PostgreSQL Drizzle migration check 通过；
- Mobile typecheck/lint、8/8 tests、Expo Doctor 20/20 通过；
- Android 与 iOS Expo export 均成功。

## 9. 已知限制

- D1 runtime 仍在上传/同步 HTTP 请求内执行 persistent job；状态、幂等和 retry
  已落库，但真正的 Cloudflare Queue/PostgreSQL worker adapter 尚未选型。大文件
  异步出队前仍受 Worker 请求时限约束；
- Canvas Connector 已可运行，但 OAuth callback、学校连接设置页和浏览器扩展尚未
  实现；当前 connection 必须由受控配置/测试数据提供；
- `.pptx` 可解析；旧 OLE `.ppt` 会以
  `LEGACY_POWERPOINT_REQUIRES_CONVERSION` 明确失败并要求转换。没有引入陈旧、
  Worker 不兼容的二进制 PPT 猜测器；
- 图片 OCR、音频转写、视频字幕、MATLAB/LTspice 项目深度解析不在本 Phase；
- D1 为迁移兼容把 embedding 存为 JSON；向量检索只在 PostgreSQL cutover 后使用
  pgvector，当前 AI Tutor 尚未改为 Course Brain retrieval；
- XLSX/DOCX 当前提取基础文本，不承诺公式、图表、批注、版式或宏的完整语义；
- 公开 Worker 未部署，真实 Canvas tenant、R2、远端 D1 和真实 Embedding Provider
  仍需 preview 验收。
- Web 构建仍报告既有的单个/多个压缩后大于 500 kB Chunk 警告，Phase 2 未做页面级
  code splitting；
- `npm audit --omit=dev` 报告 12 个中等级别告警，来自 Expo 构建依赖链中的
  `xcode → uuid`。npm 提供的自动完整修复会把 Expo 57 降到 Expo 46，属于破坏性
  变更，因此本 Phase 没有执行 `npm audit fix --force`。

下一步只能进入 Phase 3：Learning Objective、Concept、关系和可验证 retrieval；
不能跳到 Pedagogy Router 或 Learning Pack。
