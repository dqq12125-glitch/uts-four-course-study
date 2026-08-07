import Link from "next/link";
import { PublicLanguageSwitch } from "@/app/public-language-switch";
import type { PublicLocale } from "@/src/lib/public-locale";

export function PublicHeader({
  language,
  signedIn = false,
}: {
  language: PublicLocale;
  signedIn?: boolean;
}) {
  const isChinese = language === "zh-CN";

  return (
    <header className="public-header">
      <Link className="public-wordmark" href="/" aria-label="DeepStudy">
        DeepStudy<span aria-hidden="true">/</span>
      </Link>
      <nav
        className="public-header-actions"
        aria-label={isChinese ? "网站导航" : "Website navigation"}
      >
        <PublicLanguageSwitch language={language} />
        <Link className="public-header-link" href={signedIn ? "/app/today" : "/auth/sign-in"}>
          {signedIn
            ? isChinese
              ? "返回应用"
              : "Open app"
            : isChinese
              ? "登录"
              : "Sign in"}
        </Link>
        {!signedIn ? (
          <Link className="public-header-cta" href="/auth/sign-up">
            {isChinese ? "免费开始" : "Start free"}
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

export function PublicFooter({ language }: { language: PublicLocale }) {
  const isChinese = language === "zh-CN";
  return (
    <footer className="public-footer">
      <p className="public-footer-statement">
        {isChinese
          ? "少一点盲目努力，多一点真正掌握。"
          : "Less blind effort. More genuine mastery."}
      </p>
      <div className="public-footer-meta">
        <Link className="public-wordmark" href="/">
          DeepStudy<span aria-hidden="true">/</span>
        </Link>
        <nav aria-label={isChinese ? "法律文件" : "Legal documents"}>
          <Link href="/legal/privacy">
            {isChinese ? "隐私政策" : "Privacy"}
          </Link>
          <Link href="/legal/terms">
            {isChinese ? "服务条款" : "Terms"}
          </Link>
          <Link href="/legal/academic-integrity">
            {isChinese ? "学术诚信" : "Academic integrity"}
          </Link>
        </nav>
        <p>
          {isChinese
            ? "独立开发的学生学习服务，与悉尼科技大学无隶属、赞助或背书关系。"
            : "An independent student-built service. Not affiliated with, sponsored by or endorsed by UTS."}
        </p>
      </div>
    </footer>
  );
}

