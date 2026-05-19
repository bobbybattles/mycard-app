// Helpers for parsing portfolio video URLs (YouTube + Amazon Storefront).
//
// YouTube exposes a public oEmbed endpoint with CORS enabled, so we can fetch
// titles from the browser without an API key. Amazon does not — so for Amazon
// URLs we rely on the user typing the title themselves.

export type VideoSource = "youtube" | "amazon" | "other";

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Detect the source by URL pattern. Cheap, no network. */
export function detectVideoSource(url: string): VideoSource {
  if (!url) return "other";
  if (YT_RE.test(url)) return "youtube";
  // amazon.com/shop/<handle>/...  or amazon.com/dp/<asin>/...  or amzn.to/...
  if (/(?:^|\/\/)([a-z0-9-]+\.)?amazon\./i.test(url) || /amzn\.to\//i.test(url)) {
    return "amazon";
  }
  return "other";
}

/** Pull the 11-char video ID out of any common YouTube URL shape. */
export function extractYouTubeId(url: string): string | null {
  const m = url.match(YT_RE);
  return m ? m[1] : null;
}

/** Direct CDN URL for a YouTube thumbnail. hqdefault works for every public video. */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Best-effort fetch of a video's title via YouTube's oEmbed endpoint.
 * Returns null for non-YouTube URLs, unlisted/private videos, or network errors.
 * Safe to call from the browser — YouTube's oEmbed sends CORS headers.
 */
export async function fetchVideoTitle(url: string): Promise<string | null> {
  if (detectVideoSource(url) !== "youtube") return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
}
