import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = { title: "Academic Integrity" };

export default function AcademicIntegrityPage() {
  return (
    <LegalLayout title="Academic Integrity" updated="30 July 2026">
      <p className="legal-review">LEGAL REVIEW REQUIRED</p>
      <p>
        DeepStudy is designed for study planning, concept learning, original
        practice and retrieval checks. It is not designed to complete
        independently assessed work.
      </p>
      <h2>Hint-first tutoring</h2>
      <p>
        The tutor asks what the learner has tried, identifies one gap, offers
        the smallest useful hint and asks for another attempt. A full teaching
        explanation, when justified, is followed by a different transfer
        problem.
      </p>
      <h2>Suspected assessed work</h2>
      <p>
        For a live assignment, quiz, skills test or exam, DeepStudy does not
        provide a submission-ready final answer, complete essay or complete
        code solution. It can explain the concept, name a method, identify the
        next step and create a similar but different original problem.
      </p>
      <h2>Learner responsibility</h2>
      <p>
        Course rules differ. Students must follow the rules set by their
        institution and teaching staff, acknowledge permitted assistance and
        independently produce required submissions.
      </p>
      <p>
        DeepStudy is not affiliated with, sponsored by or endorsed by UTS.
      </p>
    </LegalLayout>
  );
}
