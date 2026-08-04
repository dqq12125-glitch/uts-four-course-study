import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { getPublicLocale } from "@/src/application/public-locale";

const integrityCopy = {
  "zh-CN": {
    title: "学术诚信",
    updated: "2026 年 7 月 30 日",
    review: "发布前需要法律审核",
    intro:
      "DeepStudy 用于学习规划、概念学习、原创练习和提取检查，不用于完成必须独立完成的受评分任务。",
    sections: [
      {
        title: "提示优先的辅导",
        body: "导师会先询问学习者已经尝试了什么，识别一个缺口，提供最小但有用的提示，再要求重新尝试。确有必要时给出完整教学解释，随后也会安排一道不同的迁移题。",
      },
      {
        title: "疑似受评分任务",
        body: "对于正在进行的作业、测验、技能测试或考试，DeepStudy 不会提供可直接提交的最终答案、完整论文或完整代码方案。它可以解释概念、指出方法、帮助确定下一步，并创建相似但不同的原创练习。",
      },
      {
        title: "学习者责任",
        body: "不同课程规则各不相同。学生必须遵守所在院校和教学人员制定的规则，按要求披露允许使用的辅助工具，并独立完成必须由本人提交的内容。",
      },
    ],
    affiliation:
      "DeepStudy 与悉尼科技大学无隶属、赞助或背书关系。",
  },
  en: {
    title: "Academic Integrity",
    updated: "30 July 2026",
    review: "Legal review required before launch",
    intro:
      "DeepStudy is designed for study planning, concept learning, original practice and retrieval checks. It is not designed to complete independently assessed work.",
    sections: [
      {
        title: "Hint-first tutoring",
        body: "The tutor asks what the learner has tried, identifies one gap, offers the smallest useful hint and asks for another attempt. A full teaching explanation, when justified, is followed by a different transfer problem.",
      },
      {
        title: "Suspected assessed work",
        body: "For a live assignment, quiz, skills test or exam, DeepStudy does not provide a submission-ready final answer, complete essay or complete code solution. It can explain the concept, name a method, identify the next step and create a similar but different original problem.",
      },
      {
        title: "Learner responsibility",
        body: "Course rules differ. Students must follow the rules set by their institution and teaching staff, acknowledge permitted assistance and independently produce required submissions.",
      },
    ],
    affiliation:
      "DeepStudy is not affiliated with, sponsored by or endorsed by UTS.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getPublicLocale();
  return { title: integrityCopy[language].title };
}

export default async function AcademicIntegrityPage() {
  const language = await getPublicLocale();
  const content = integrityCopy[language];
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
