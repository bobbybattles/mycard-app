import Image from "next/image";
import type { ProfileCardData } from "./profile-card-editor";
import StarEmblem, { LEVEL_LABELS } from "./star-emblem";
import CopyButton from "./copy-button";

type Props = {
  username: string;
  data: ProfileCardData;
};

// Strip protocol + leading www + trailing slash so the displayed text reads
// like "amazon.com/shop/handle" instead of the full URL.
function prettifyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

// Compact horizontal profile card.
// Photo stretches to match the right column's text height (no dead space).
// Order: name + star badge → url · email (with copy) → bio → location.
export default function ProfileCard({ username, data }: Props) {
  const displayName = data.name || `@${username}`;
  const initial = (data.name?.[0] ?? username[0] ?? "?").toUpperCase();

  return (
    <header className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-7 sm:py-6 shadow-sm h-full">
      <div className="flex flex-row items-stretch gap-4 sm:gap-6">
        <div className="relative w-28 sm:w-36 shrink-0 self-stretch rounded-2xl overflow-hidden bg-pink-100 min-h-[120px]">
          {data.photo_url ? (
            <Image
              src={data.photo_url}
              alt={displayName}
              fill
              sizes="(min-width: 640px) 144px, 112px"
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-pink-600">
              {initial}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
            {displayName}
          </h1>

          {(data.star_level || data.top_creator) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
              {data.star_level && (
                <span className="inline-flex items-center gap-1.5">
                  <StarEmblem level={data.star_level} size={18} />
                  <span className="font-semibold text-slate-700">
                    {LEVEL_LABELS[data.star_level]} Creator
                  </span>
                </span>
              )}
              {data.top_creator && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
                  ★ Top Creator
                </span>
              )}
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            {data.amazon_storefront ? (
              <a
                href={data.amazon_storefront}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-pink-600 hover:text-pink-700 hover:underline break-all"
              >
                {prettifyUrl(data.amazon_storefront)}
              </a>
            ) : (
              <span className="font-mono text-slate-500">mycard.to/{username}</span>
            )}

            {data.email && (
              <span className="inline-flex items-center gap-0.5">
                <a
                  href={`mailto:${data.email}`}
                  className="text-pink-600 hover:text-pink-700 hover:underline break-all"
                >
                  ✉ {data.email}
                </a>
                <CopyButton value={data.email} className="text-pink-600 hover:text-pink-700" />
              </span>
            )}
          </div>

          {data.bio && (
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              {data.bio}
            </p>
          )}

          {data.location && (
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              📍 {data.location}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
