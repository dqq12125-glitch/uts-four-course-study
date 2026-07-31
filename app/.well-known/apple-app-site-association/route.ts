import { getRuntimeEnvironment } from "@/src/infrastructure/environment";

export async function GET(): Promise<Response> {
  const teamId = getRuntimeEnvironment().APPLE_TEAM_ID?.trim();
  const details = teamId
    ? [
        {
          appID: `${teamId}.com.deepstudy.student`,
          paths: ["/auth/callback", "/auth/callback?*"],
        },
      ]
    : [];
  return Response.json(
    { applinks: { apps: [], details } },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/json",
      },
    },
  );
}
