import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="saas-shell saas-auth-shell">
      <Link className="saas-wordmark" href="/">
        DeepStudy
      </Link>
      {children}
    </main>
  );
}
