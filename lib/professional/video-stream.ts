import { NextRequest, NextResponse } from 'next/server';
import { contentTypeFromPath } from '@/lib/professional-video';
import { downloadProfessionalVideo } from '@/lib/professional/professional-video-storage';

export async function streamVideoResponse(
  storagePath: string,
  request: NextRequest,
): Promise<NextResponse> {
  const buffer = await downloadProfessionalVideo(storagePath);
  const contentType = contentTypeFromPath(storagePath);
  const range = request.headers.get('range');

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Content-Disposition': 'inline',
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  };

  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (match) {
      const start = Number.parseInt(match[1], 10);
      const end = match[2] ? Number.parseInt(match[2], 10) : buffer.length - 1;
      const safeEnd = Math.min(end, buffer.length - 1);

      if (start > safeEnd || start >= buffer.length) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes */${buffer.length}`,
          },
        });
      }

      const chunk = buffer.subarray(start, safeEnd + 1);
      return new NextResponse(chunk as unknown as BodyInit, {
        status: 206,
        headers: {
          ...baseHeaders,
          'Content-Range': `bytes ${start}-${safeEnd}/${buffer.length}`,
          'Content-Length': String(chunk.length),
        },
      });
    }
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      ...baseHeaders,
      'Content-Length': String(buffer.length),
    },
  });
}
