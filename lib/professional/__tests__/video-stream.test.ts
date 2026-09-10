import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/professional/professional-video-storage", () => ({
  downloadProfessionalVideo: vi.fn(),
}));

import { downloadProfessionalVideo } from "@/lib/professional/professional-video-storage";
import { streamVideoResponse } from "@/lib/professional/video-stream";

const mockedDownload = vi.mocked(downloadProfessionalVideo);

describe("streamVideoResponse", () => {
  beforeEach(() => {
    mockedDownload.mockReset();
    mockedDownload.mockResolvedValue(Buffer.from("0123456789"));
  });

  it("sem Range devolve 200 com tamanho total", async () => {
    const req = new NextRequest("http://localhost/video");
    const res = await streamVideoResponse("professional-videos/u/x.mp4", req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Length")).toBe("10");
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Type")).toBe("video/mp4");
  });

  it("Range parcial devolve 206 e Content-Range", async () => {
    const req = new NextRequest("http://localhost/video", {
      headers: { Range: "bytes=0-3" },
    });
    const res = await streamVideoResponse("professional-videos/u/x.webm", req);
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-3/10");
    expect(res.headers.get("Content-Length")).toBe("4");
    expect(res.headers.get("Content-Type")).toBe("video/webm");
  });

  it("Range inválido devolve 416", async () => {
    const req = new NextRequest("http://localhost/video", {
      headers: { Range: "bytes=10-12" },
    });
    const res = await streamVideoResponse("professional-videos/u/x.mp4", req);
    expect(res.status).toBe(416);
    expect(res.headers.get("Content-Range")).toBe("bytes */10");
  });
});
