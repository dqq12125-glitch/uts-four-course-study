import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="saas-error-page">
      <section className="saas-card">
        <p className="saas-eyebrow">404</p>
        <h1>这个页面不存在或你没有访问权限</h1>
        <p>为了保护不同用户的数据，私有资源和不存在的资源使用相同的提示。</p>
        <Link className="saas-button saas-button-primary" href="/">
          返回 DeepStudy
        </Link>
      </section>
    </main>
  );
}
