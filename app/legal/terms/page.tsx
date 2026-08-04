import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { getPublicLocale } from "@/src/application/public-locale";

const termsCopy = {
  "zh-CN": {
    title: "服务条款",
    updated: "2026 年 7 月 30 日",
    review: "发布前需要法律审核",
    intro:
      "这些发布前条款是占位草案，不能替代针对最终运营主体、《澳大利亚消费者法》、退款、责任、税务和年龄要求的专业意见。",
    sections: [
      {
        title: "学习服务",
        body: "DeepStudy 提供规划、练习、提醒和学习支持。它不保证成绩、录取、完成课程，也不保证自动提取的信息完全正确。用户必须向所在院校核实日期和课程要求。",
      },
      {
        title: "账户与合理使用",
        body: "用户必须提供本人控制的邮箱、妥善保管登录链接，不得探测其他账户、绕过权益限制、上传违法材料、滥用 AI 容量或干扰服务。经核实的滥用行为可能导致账户暂停。",
      },
      {
        title: "付款",
        body: "价格以澳大利亚元显示并由服务端确认。创始学期通行证计划为一次性学期购买。正式启用付款前，必须确认最终访问日期、退款权利、税务和运营主体。",
      },
      {
        title: "知识产权与上传内容",
        body: "用户保留其对私人上传内容所拥有的权利，只授予为其本人账户存储和处理这些文件所必需的有限许可。用户必须有权上传相关材料。由用户资料生成的问题默认保持私密。",
      },
      {
        title: "学术诚信",
        body: "用户仍有责任遵守所在院校的规则。DeepStudy 不得用于取得或提交本应独立完成的作业。",
      },
      {
        title: "变更与终止",
        body: "重大变更应在生效前通知。用户可以导出数据或删除账户。服务终止和付费访问补救措施需要最终法律审核。",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: "30 July 2026",
    review: "Legal review required before launch",
    intro:
      "These pre-launch terms are placeholders and are not a substitute for advice covering the final operator, Australian Consumer Law, refunds, liability, tax and age requirements.",
    sections: [
      {
        title: "Learning service",
        body: "DeepStudy provides planning, practice, reminders and learning support. It does not guarantee grades, admission, course completion or that automatically extracted information is correct. Users must verify dates and course requirements with their institution.",
      },
      {
        title: "Accounts and acceptable use",
        body: "Users must provide an email address they control, keep sign-in links private, and must not probe other accounts, bypass entitlements, upload unlawful material, abuse AI capacity or disrupt the service. Accounts may be suspended for verified abuse.",
      },
      {
        title: "Payments",
        body: "Prices are shown in Australian dollars and confirmed by the server. The Founding Semester Pass is intended as a one-time semester purchase. Final access dates, refund rights, taxes and the operating entity must be confirmed before payments are enabled in production.",
      },
      {
        title: "Intellectual property and uploads",
        body: "Users retain rights they hold in private uploads and grant only the limited permission needed to store and process those files for their own account. Users must have permission to upload the material. User-derived questions remain private by default.",
      },
      {
        title: "Academic integrity",
        body: "Users remain responsible for meeting institutional rules. DeepStudy must not be used to obtain or submit work that should be completed independently.",
      },
      {
        title: "Changes and termination",
        body: "Material changes should be notified before taking effect. Users may export or delete their account. Service termination and paid-access remedies require final legal review.",
      },
    ],
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  return { title: termsCopy[language].title };
}

export default async function TermsPage() {
  const language = await getPublicLocale();
  const content = termsCopy[language];
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
    </LegalLayout>
  );
}
