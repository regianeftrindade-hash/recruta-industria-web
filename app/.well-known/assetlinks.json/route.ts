import { NextResponse } from "next/server";
import { ANDROID_PACKAGE_NAME, getAndroidSha256Fingerprints } from "@/lib/pwa/app-identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const fingerprints = getAndroidSha256Fingerprints();
  const body =
    fingerprints.length === 0
      ? []
      : [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: ANDROID_PACKAGE_NAME,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
