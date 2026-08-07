import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { getPublicLocale } from "@/src/application/public-locale";

const privacyCopy = {
  "zh-CN": {
    title: "隐私政策",
    updated: "2026 年 7 月 30 日",
    review: "发布前需要法律审核",
    intro:
      "这是便于理解的发布前政策草案。正式上线前，必须根据最终运营主体、联系方式、《澳大利亚隐私法》的适用性、境外披露、支付条款和保留义务完成法律审核。",
    sections: [
      {
        title: "DeepStudy 收集哪些数据",
        body: "账户资料包括邮箱、显示名称、语言、时区和学习偏好。学习数据包括学期、课程、课表、截止日期、任务、专注记录、练习尝试、错误类型和掌握记录。如果你主动使用相关功能，DeepStudy 还会保存私人上传文件和 AI 导师对话。",
      },
      {
        title: "为什么使用这些数据",
        body: "数据用于验证账户、生成每日计划、提供练习与复测、发送用户要求的提醒、执行产品额度、处理购买、安全防护以及衡量汇总后的产品表现。",
      },
      {
        title: "私人课程资料与模型训练",
        body: "私人课程资料按上传用户隔离，不会自动分享给其他用户，也不会用于训练公开模型。提取的文本始终被视为不可信的私人上下文，不能改变系统权限。",
      },
      {
        title: "服务提供商",
        body: "计划中的正式服务使用 Cloudflare 提供应用、数据库和私有对象基础设施，并使用邮件发送服务、Stripe 支付服务，以及在 AI 功能启用时所配置的模型提供商。最终提供商名称、区域和子处理方需要在审核后的政策中确认。",
      },
      {
        title: "数据保留",
        body: "账户存续期间会保留账户数据。上传资源具有保留日期，也可以随时删除。运营日志有意排除密码、完整课程资料和完整私人 AI 对话。最终的法律与财务保留期限仍需审核。",
      },
      {
        title: "导出与删除",
        body: "登录用户可以导出结构化个人数据、删除单个文件，或在隐私设置中永久删除账户。删除账户时会先移除私人文件，再删除数据库账户；如果文件删除失败，数据库删除会停止并允许重试。",
      },
      {
        title: "联系方式",
        body: "公开发布前必须补充运营主体法定名称、邮寄地址和隐私联系邮箱。",
      },
    ],
    affiliation:
      "DeepStudy 是独立开发的学生学习服务，与悉尼科技大学无隶属、赞助或背书关系。",
  },
  en: {
    title: "Privacy Policy",
    updated: "30 July 2026",
    review: "Legal review required before launch",
    intro:
      "This is a plain-language pre-launch policy draft. It must be reviewed for the final operator, contact details, Australian Privacy Act applicability, overseas disclosures, payment terms and retention obligations before production launch.",
    sections: [
      {
        title: "What DeepStudy collects",
        body: "Account details include email address, display name, language, time zone and study preferences. Learning data includes semesters, courses, class sessions, deadlines, tasks, focus sessions, practice attempts, error types and mastery records. If you choose to use them, DeepStudy also stores private uploaded files and AI tutor conversations.",
      },
      {
        title: "Why the data is used",
        body: "Data is used to authenticate the account, create daily plans, provide practice and retesting, deliver requested reminders, enforce product limits, process purchases, secure the service and measure aggregated product performance.",
      },
      {
        title: "Private course materials and model training",
        body: "Private course materials are isolated to the uploading user. They are not automatically shared with other users and are not used to train a public model. Extracted text is treated as untrusted private context and cannot change system permissions.",
      },
      {
        title: "Service providers",
        body: "The planned production service uses Cloudflare for application, database and private object infrastructure; an email delivery provider; Stripe for payments; and a configured AI provider when AI features are enabled. Final provider names, regions and subprocessors must be confirmed in the reviewed policy.",
      },
      {
        title: "Retention",
        body: "Account data is kept while the account is active. Uploaded resources carry a retention date and can be deleted at any time. Operational logs intentionally exclude passwords, complete course materials and full private AI conversations. Final legal and financial retention periods require review.",
      },
      {
        title: "Export and deletion",
        body: "Signed-in users can export their structured personal data, delete individual files, or permanently delete their account from Privacy settings. Account deletion removes private files before deleting the database account; if file deletion fails, database deletion stops and can be retried.",
      },
      {
        title: "Contact",
        body: "Operator legal name, postal address and privacy contact email must be inserted before public launch.",
      },
    ],
    affiliation:
      "DeepStudy is an independent student-built service. It is not affiliated with, sponsored by or endorsed by the University of Technology Sydney.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  return { title: privacyCopy[language].title };
}

export default async function PrivacyPage() {
  const language = await getPublicLocale();
  const content = privacyCopy[language];
  return (
    <LegalLayout language={language} title={content.title} updated={content.updated}>
      <p className="legal-review">{content.review}</p>
      <p>{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p>{content.affiliation}</p>
    </LegalLayout>
  );
}
