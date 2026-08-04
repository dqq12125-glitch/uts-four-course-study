import { PublicFooter, PublicHeader } from "@/app/public-site-chrome";
import type { PublicLocale } from "@/src/lib/public-locale";

export function LegalLayout({
  language,
  title,
  updated,
  children,
}: {
  language: PublicLocale;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const isChinese = language === "zh-CN";
  return (
    <div className="public-site public-legal-page">
      <PublicHeader language={language} />
      <main>
        <article className="legal-document">
          <header>
            <p className="public-section-label">
              {isChinese ? `更新于 ${updated}` : `Last updated ${updated}`}
            </p>
            <h1>{title}</h1>
          </header>
          {children}
        </article>
      </main>
      <PublicFooter language={language} />
    </div>
  );
}
