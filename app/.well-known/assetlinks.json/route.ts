import { getRuntimeEnvironment } from "@/src/infrastructure/environment";

export async function GET(): Promise<Response> {
  const fingerprints = (
    getRuntimeEnvironment().ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS ?? ""
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return Response.json(
    fingerprints.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: "com.deepstudy.student",
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [],
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/json",
      },
    },
  );
}
