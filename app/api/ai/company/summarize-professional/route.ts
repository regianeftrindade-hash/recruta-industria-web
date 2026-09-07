import { NextRequest } from "next/server";
import { handlePremiumCompanyStub } from "@/lib/ai/http";

/** POST /api/ai/company/summarize-professional — stub Premium (futuro). */
export async function POST(request: NextRequest) {
  return handlePremiumCompanyStub(request, "summarize_professional");
}
