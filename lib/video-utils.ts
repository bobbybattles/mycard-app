// Helpers for parsing portfolio video URLs.
//
// YouTube exposes a public oEmbed endpoint with CORS enabled, so we can fetch
// titles from the browser without an API key. Amazon does not — so for Amazon
// URLs we rely on a server-side scrape (/api/video-meta).

export type VideoSource =
  | "youtube"
  | "amazon"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "other";

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const TIKTOK_RE = /tiktok\.com\/[^/]*\/?video\/(\d+)/i;
const IG_RE = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i;
const FB_RE = /(?:facebook\.com|fb\.watch)\//i;

/** Detect the source by URL pattern. Cheap, no network. */
export function detectVideoSource(url: string): VideoSource {
  if (!url) return "other";
  if (YT_RE.test(url)) return "youtube";
  if (TIKTOK_RE.test(url)) return "tiktok";
  if (IG_RE.test(url)) return "instagram";
  if (FB_RE.test(url)) return "facebook";
  if (/(?:^|\/\/)([a-z0-9-]+\.)?amazon\./i.test(url) || /amzn\.to\//i.test(url)) {
    return "amazon";
  }
  return "other";
}

/** Extract the numeric video ID from a TikTok video URL. */
export function extractTikTokId(url: string): string | null {
  const m = url.match(TIKTOK_RE);
  return m ? m[1] : null;
}

/** Build a TikTok inline embed URL. Plays in an iframe; no SDK needed. */
export function getTikTokEmbedUrl(videoId: string): string {
  return `https://www.tiktok.com/embed/v2/${videoId}`;
}

/** Extract the shortcode from an Instagram post / reel / IGTV URL. */
export function extractInstagramShortcode(url: string): string | null {
  const m = url.match(IG_RE);
  return m ? m[1] : null;
}

/**
 * Build an Instagram inline embed URL. Works for posts (/p), reels (/reel),
 * and IGTV (/tv). Plays in an iframe; no SDK or token needed.
 */
export function getInstagramEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${shortcode}/embed/`;
}

/**
 * Build a Facebook video/reel embed URL using the public plugins/video.php
 * iframe. Accepts any facebook.com or fb.watch URL.
 */
export function getFacebookEmbedUrl(originalUrl: string): string {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
    originalUrl
  )}&show_text=false&autoplay=true`;
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
export async function fetchYouTubeTitle(url: string): Promise<string | null> {
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

export type VideoMeta = {
  title: string | null;
  thumbnail: string | null;
  /** HLS .m3u8 stream URL, when the source exposes one (currently Amazon VDP). */
  hls: string | null;
};

/**
 * Fetch metadata for any portfolio URL.
 *   - YouTube: uses oEmbed for the title; thumbnail is derived from the video ID.
 *   - Amazon: calls our /api/video-meta route, which scrapes the page's OG tags.
 *   - Other: returns nulls.
 */
export async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  const source = detectVideoSource(url);

  if (source === "youtube") {
    const id = extractYouTubeId(url);
    const [title] = await Promise.all([fetchYouTubeTitle(url)]);
    return {
      title,
      thumbnail: id ? getYouTubeThumbnail(id) : null,
      hls: null,
    };
  }

  if (
    source === "amazon" ||
    source === "tiktok" ||
    source === "instagram" ||
    source === "facebook"
  ) {
    try {
      const res = await fetch(`/api/video-meta?url=${encodeURIComponent(url)}`);
      if (!res.ok) return { title: null, thumbnail: null, hls: null };
      const data = (await res.json()) as Partial<VideoMeta>;
      return {
        title: data.title ?? null,
        thumbnail: data.thumbnail ?? null,
        hls: data.hls ?? null,
      };
    } catch {
      return { title: null, thumbnail: null, hls: null };
    }
  }

  return { title: null, thumbnail: null, hls: null };
}

/** Build a YouTube embed URL for an inline iframe player. */
export function getYouTubeEmbedUrl(videoId: string, opts?: { autoplay?: boolean }): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (opts?.autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
