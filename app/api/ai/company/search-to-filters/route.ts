import { NextRequest } from "next/server";
import { handlePremiumCompanyStub } from "@/lib/ai/http";

/** POST /api/ai/company/search-to-filters — stub Premium (futuro). */
export async function POST(request: NextRequest) {
  return handlePremiumCompanyStub(request, "search_to_filters");
}
