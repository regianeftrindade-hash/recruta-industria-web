import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPublicJobView } from "@/lib/jobs/job-posting-db";

export const alt = "Oportunidade no Recruta Indústria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let title = "Oportunidade";
  let detail = "Recruta Indústria";

  try {
    const view = await getPublicJobView(id);
    if (view?.availability === "open") {
      title = view.job.title;
      detail = view.job.companyLabel;
    } else if (view?.availability === "unavailable") {
      title = view.title;
      detail = "Candidatura indisponível";
    }
  } catch {
    title = "Oportunidade";
  }

  let logoSrc: string | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "simbolo-recruta.png"));
    logoSrc = `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    logoSrc = null;
  }

  const safeTitle = title.trim().slice(0, 90) || "Oportunidade";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1c1c1c",
          color: "#f5f5f5",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} width={84} height={84} alt="" />
          ) : null}
          <div style={{ display: "flex", fontSize: 28, color: "#c89b3c", fontWeight: 700 }}>
            RECRUTA INDÚSTRIA
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {safeTitle}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#c89b3c" }}>
            {detail}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
