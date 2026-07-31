import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="30 July 2026">
      <p className="legal-review">LEGAL REVIEW REQUIRED</p>
      <p>
        This is a clear pre-launch policy placeholder. It must be reviewed for
        the operating entity, contact details, Australian Privacy Act
        applicability, overseas disclosures, payment terms and retention
        obligations before production launch.
      </p>
      <h2>What DeepStudy collects</h2>
      <p>
        Account details include email address, display name, language, time
        zone and study preferences. Learning data includes semesters, courses,
        class sessions, deadlines, tasks, focus sessions, practice attempts,
        error types and mastery records. If you choose to use them, DeepStudy
        also stores private uploaded files and AI tutor conversations.
      </p>
      <h2>Why the data is used</h2>
      <p>
        Data is used to authenticate the account, create daily plans, provide
        practice and retesting, deliver requested reminders, enforce product
        limits, process purchases, secure the service and measure aggregated
        product performance.
      </p>
      <h2>Private course materials and model training</h2>
      <p>
        Private course materials are isolated to the uploading user. They are
        not automatically shared with other users and are not used to train a
        public model. Extracted text is treated as untrusted private context
        and cannot change system permissions.
      </p>
      <h2>Service providers</h2>
      <p>
        The planned production service uses Cloudflare for application,
        database and private object infrastructure; an email delivery
        provider; Stripe for payments; and a configured AI provider when AI
        features are enabled. Final provider names, regions and subprocessors
        must be confirmed in the reviewed policy.
      </p>
      <h2>Retention</h2>
      <p>
        Account data is kept while the account is active. Uploaded resources
        carry a retention date and can be deleted at any time. Operational
        logs intentionally exclude passwords, complete course materials and
        full private AI conversations. Final legal and financial retention
        periods require review.
      </p>
      <h2>Export and deletion</h2>
      <p>
        Signed-in users can export their structured personal data, delete
        individual files, or permanently delete their account from Privacy
        settings. Account deletion removes private files before deleting the
        database account; if file deletion fails, database deletion stops and
        can be retried.
      </p>
      <h2>Contact</h2>
      <p>
        Operator legal name, postal address and privacy contact email must be
        inserted before public launch.
      </p>
      <p>
        DeepStudy is an independent student-built service. It is not
        affiliated with, sponsored by or endorsed by the University of
        Technology Sydney.
      </p>
    </LegalLayout>
  );
}
