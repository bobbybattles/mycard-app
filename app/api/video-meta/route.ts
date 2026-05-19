// Server-side metadata scraper for video URLs (primarily Amazon VDP pages).
// We fetch the URL, parse <meta> tags, and return a small JSON blob:
//   { title, thumbnail, hls } — all optional.
//
// Why server-side: Amazon serves CORS-blocked HTML, so we can't fetch from
// the browser. Doing it on our server with a normal browser User-Agent works.
// YouTube uses the public oEmbed endpoint client-side (see video-utils.ts).

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs"; // We need text fetch + regex; not on Edge.

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

// Pull a meta tag's content by property OR name.
function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const m1 = html.match(re);
  if (m1) return decodeHtmlEntities(m1[1]);
  // Some pages put content= before property=
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? decodeHtmlEntities(m2[1]) : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing ?url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  const host = parsed.hostname.toLowerCase();

  // TikTok: hit its public oEmbed endpoint.
  if (/(^|\.)tiktok\.com$/.test(host)) {
    return fetchTikTokOembed(target);
  }

  // Instagram: scrape OG tags from the public post/reel page.
  if (/(^|\.)instagram\.com$/.test(host)) {
    return fetchInstagramOg(target);
  }

  // Facebook: scrape OG tags. Falls back gracefully if blocked.
  if (/(^|\.)facebook\.com$/.test(host) || /^fb\.watch$/.test(host)) {
    return fetchFacebookOg(target);
  }

  // Amazon: scrape Open Graph meta tags out of the page HTML.
  if (/(^|\.)amazon\./.test(host) || /^amzn\.to$/.test(host)) {
    return fetchAmazonOg(target);
  }

  return NextResponse.json(
    { error: "Unsupported host" },
    { status: 400 }
  );
}

// TikTok exposes a public oEmbed endpoint that returns JSON with title +
// thumbnail. No API key required. Cached at the edge for a day.
async function fetchTikTokOembed(target: string) {
  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(target)}`,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
    };
    // Use the bare title; fall back to "<author>" if title is missing.
    const title = data.title?.trim() || data.author_name?.trim() || null;
    return NextResponse.json({
      title,
      thumbnail: data.thumbnail_url ?? null,
      hls: null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Fetch failed" },
      { status: 502 }
    );
  }
}

// Instagram public posts / reels: scrape og:image + og:title.
// Instagram aggressively blocks scrapers; falls back to nulls gracefully so
// the inline embed iframe still renders even without a thumbnail.
async function fetchInstagramOg(target: string) {
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({
        title: null,
        thumbnail: null,
        hls: null,
      });
    }
    const head = (await res.text()).slice(0, 250_000);
    const thumbnail =
      meta(head, "og:image:secure_url") || meta(head, "og:image") || null;
    let title =
      meta(head, "og:title") ||
      meta(head, "og:description") ||
      head.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;
    if (title) {
      // Strip Instagram's "@user on Instagram: \"caption\"" wrapper down to caption.
      const m = title.match(/on Instagram:\s*["“](.+?)["”]/i);
      if (m) title = m[1];
      title = title.replace(/\s+•\s+Instagram(?:\s+(?:photos|videos)?.*)?$/i, "");
      if (title.length > 200) title = title.slice(0, 197) + "…";
    }
    return NextResponse.json({
      title: title || null,
      thumbnail: thumbnail || null,
      hls: null,
    });
  } catch {
    return NextResponse.json({ title: null, thumbnail: null, hls: null });
  }
}

// Facebook video / reel pages: same OG scrape pattern as Instagram.
async function fetchFacebookOg(target: string) {
  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ title: null, thumbnail: null, hls: null });
    }
    const head = (await res.text()).slice(0, 250_000);
    const thumbnail =
      meta(head, "og:image:secure_url") || meta(head, "og:image") || null;
    let title =
      meta(head, "og:title") ||
      meta(head, "og:description") ||
      head.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;
    if (title) {
      // Strip "| Facebook" or " - Facebook" suffix.
      title = title.replace(/\s*[\|\-–]\s*Facebook\s*$/i, "");
      if (title.length > 200) title = title.slice(0, 197) + "…";
    }
    return NextResponse.json({
      title: title || null,
      thumbnail: thumbnail || null,
      hls: null,
    });
  } catch {
    return NextResponse.json({ title: null, thumbnail: null, hls: null });
  }
}

// Amazon VDP / Shop pages — scrape og:image, og:video (HLS), og:title.
async function fetchAmazonOg(target: string) {

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      // Cache at the edge for 1 day — these meta values don't change often.
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: 502 }
      );
    }
    // Only read the first ~250KB — meta tags live in <head>, no need to download the full page.
    const text = await res.text();
    const head = text.slice(0, 250_000);

    // Title preference: og:image:alt strips the "Watch ... on Amazon Live" wrapper,
    // but og:title or <title> is also a fine fallback. Try several in order.
    const ogAlt = meta(head, "og:image:alt");
    const ogTitle = meta(head, "og:title");
    const ogDesc = meta(head, "og:description");
    const docTitle =
      head.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
    let title =
      cleanAmazonTitle(ogAlt) ||
      cleanAmazonTitle(ogTitle) ||
      cleanAmazonTitle(ogDesc) ||
      cleanAmazonTitle(docTitle);

    // Amazon often returns a title like
    //   "Watch <real title> on Amazon Live"
    // — already stripped above. If it still ends with "..." it was truncated;
    // we leave the ellipsis since it's not a parsing artifact.
    if (title && title.length > 200) title = title.slice(0, 197) + "…";

    const thumbnail =
      meta(head, "og:image:secure_url") || meta(head, "og:image");
    const hls = meta(head, "og:video:secure_url") || meta(head, "og:video");

    return NextResponse.json({
      title: title || null,
      thumbnail: thumbnail || null,
      hls: hls && /\.m3u8(\?|$)/i.test(hls) ? hls : null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Fetch failed" },
      { status: 502 }
    );
  }
}

function cleanAmazonTitle(s: string | null): string | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  // "Watch <title> on Amazon Live" → "<title>"
  const m = trimmed.match(/^Watch (.+?) on Amazon Live$/i);
  if (m) return m[1];
  // ": Amazon.com" / "- Amazon.com" suffix on <title>
  return trimmed.replace(/\s*[:\-–|]\s*Amazon(?:\.com)?(?:\s+Live)?\s*$/i, "");
}
