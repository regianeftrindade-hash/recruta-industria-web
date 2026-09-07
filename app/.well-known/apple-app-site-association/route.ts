import { NextResponse } from "next/server";
import { getIosAppId } from "@/lib/pwa/app-identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = getIosAppId();
  const body = appId
    ? {
        applinks: {
          apps: [],
          details: [
            {
              appID: appId,
              paths: ["*"],
            },
          ],
        },
        webcredentials: {
          apps: [appId],
        },
      }
    : {
        applinks: { apps: [], details: [] },
      };

  return new NextResponse(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
