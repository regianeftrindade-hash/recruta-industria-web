import { NextRequest } from "next/server";
import { handlePremiumCompanyStub } from "@/lib/ai/http";

/** POST /api/ai/company/interview-questions — stub Premium (futuro). */
export async function POST(request: NextRequest) {
  return handlePremiumCompanyStub(request, "interview_questions");
}
