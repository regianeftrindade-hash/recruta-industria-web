import { ImageResponse } from "next/og";
import { getPublicJobView } from "@/lib/jobs/job-posting-db";
import { usefulShareFacts } from "@/lib/jobs/public-job-link";

export const alt = "Oportunidade no Recruta Indústria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let title = "Oportunidade";
  let detail = "Recruta Indústria";
  let facts = "";

  try {
    const view = await getPublicJobView(id);
    if (view?.availability === "open") {
      title = view.job.title;
      detail = view.job.companyLabel;
      facts = usefulShareFacts(view.job, "card").slice(0, 2).join(" · ").slice(0, 70);
    } else if (view?.availability === "unavailable") {
      title = view.title;
      detail = "Candidatura indisponível";
    }
  } catch {
    title = "Oportunidade";
  }

  const safeTitle = title.trim().slice(0, 72) || "Oportunidade";
  const safeDetail = detail.trim().slice(0, 42);
  const titleSize = safeTitle.length > 32 ? 40 : safeTitle.length > 22 ? 46 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3E6C8",
          color: "#2A241C",
        }}
      >
        <div
          style={{
            width: 640,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: "#8D6B1F", fontWeight: 700 }}>
            RECRUTA INDÚSTRIA
          </div>
          <div
            style={{
              display: "flex",
              width: 640,
              justifyContent: "center",
              textAlign: "center",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.12,
            }}
          >
            {safeTitle}
          </div>
          <div
            style={{
              display: "flex",
              width: 640,
              justifyContent: "center",
              textAlign: "center",
              fontSize: 32,
              color: "#8D6B1F",
              fontWeight: 700,
            }}
          >
            {safeDetail}
          </div>
          {facts ? (
            <div
              style={{
                display: "flex",
                width: 640,
                justifyContent: "center",
                textAlign: "center",
                fontSize: 26,
              }}
            >
              {facts}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
