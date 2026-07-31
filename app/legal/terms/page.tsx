import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="30 July 2026">
      <p className="legal-review">LEGAL REVIEW REQUIRED</p>
      <p>
        These pre-launch terms are placeholders and are not a substitute for
        advice covering the final operator, Australian Consumer Law, refunds,
        liability, tax and age requirements.
      </p>
      <h2>Learning service</h2>
      <p>
        DeepStudy provides planning, practice, reminders and learning support.
        It does not guarantee grades, admission, course completion or that
        automatically extracted information is correct. Users must verify
        dates and course requirements with their institution.
      </p>
      <h2>Accounts and acceptable use</h2>
      <p>
        Users must provide an email address they control, keep sign-in links
        private, and must not probe other accounts, bypass entitlements,
        upload unlawful material, abuse AI capacity or disrupt the service.
        Accounts may be suspended for verified abuse.
      </p>
      <h2>Payments</h2>
      <p>
        Prices are shown in Australian dollars and confirmed by the server.
        The Founding Pass is intended as a one-time semester purchase. Final
        access dates, refund rights, taxes and the operating entity must be
        confirmed before payments are enabled in production.
      </p>
      <h2>Intellectual property and uploads</h2>
      <p>
        Users retain rights they hold in private uploads and grant only the
        limited permission needed to store and process those files for their
        own account. Users must have permission to upload the material.
        User-derived questions remain private by default.
      </p>
      <h2>Academic integrity</h2>
      <p>
        Users remain responsible for meeting institutional rules. DeepStudy
        must not be used to obtain or submit work that should be completed
        independently.
      </p>
      <h2>Changes and termination</h2>
      <p>
        Material changes should be notified before taking effect. Users may
        export or delete their account. Service termination and paid-access
        remedies require final legal review.
      </p>
    </LegalLayout>
  );
}
