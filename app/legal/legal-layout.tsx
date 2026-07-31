import Link from "next/link";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <header>
        <Link className="marketing-wordmark" href="/">
          DeepStudy
        </Link>
        <Link href="/">返回首页</Link>
      </header>
      <article>
        <p className="marketing-kicker">Last updated {updated}</p>
        <h1>{title}</h1>
        {children}
      </article>
      <nav aria-label="Legal documents">
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/academic-integrity">
          Academic Integrity
        </Link>
      </nav>
    </main>
  );
}
