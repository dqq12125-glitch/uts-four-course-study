import type {
  Course,
  MobileExchangeResponse,
  SourceReference,
} from "@deepstudy/shared-types";

export const courseContractFixture: Course = {
  id: "course_contract_1",
  userSemesterId: "semester_contract_1",
  courseTemplateId: null,
  courseCode: "ENGR1001",
  courseName: "Engineering Foundations",
  colourKey: "ocean",
  instructorName: "Dr Example",
  sourceType: "manual",
  assessmentCount: 2,
};

export const mobileExchangeContractFixture: MobileExchangeResponse = {
  sessionToken: "session_contract_token",
  expiresAt: "2026-08-04T00:00:00.000Z",
  user: {
    id: "user_contract_1",
    email: "student@example.edu",
    displayName: "Student",
    preferredLanguage: "en",
    timezone: "Australia/Sydney",
    onboardingCompleted: true,
  },
};

export const sourceReferenceContractFixture: SourceReference = {
  resourceId: "resource_contract_1",
  courseId: "course_contract_1",
  page: 12,
  section: "Kirchhoff's voltage law",
};
