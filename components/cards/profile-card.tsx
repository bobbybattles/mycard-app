import Image from "next/image";
import type { ProfileCardData } from "./profile-card-editor";
import StarEmblem, { LEVEL_LABELS } from "./star-emblem";

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

// Public render of the Profile card on mycard.to/<username>.
// Server-rendered for speed + SEO.
//
// Compact horizontal layout (Fizz, 2026-05-19):
//   Photo on the left, name + star + url + bio + email + location stacked
//   tightly in a right column. Keeps the whole profile above the fold.
export default function ProfileCard({ username, data }: Props) {
  const displayName = data.name || `@${username}`;
  const initial = (data.name?.[0] ?? username[0] ?? "?").toUpperCase();

  return (
    <header className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-7 sm:py-6 shadow-sm">
      <div className="flex flex-row items-start gap-4 sm:gap-6">
        <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-2xl overflow-hidden bg-pink-100 flex items-center justify-center text-3xl font-bold text-pink-600 ring-2 ring-white shadow-sm">
          {data.photo_url ? (
            <Image
              src={data.photo_url}
              alt={displayName}
              fill
              sizes="(min-width: 640px) 128px, 96px"
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>
            {data.star_level && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200 px-2.5 py-1">
                <StarEmblem level={data.star_level} size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700">
                  {LEVEL_LABELS[data.star_level]}
                </span>
              </div>
            )}
          </div>

          {data.amazon_storefront ? (
            <a
              href={data.amazon_storefront}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs sm:text-sm font-mono text-pink-600 hover:text-pink-700 hover:underline break-all"
            >
              {prettifyUrl(data.amazon_storefront)}
            </a>
          ) : (
            <p className="mt-1 text-xs sm:text-sm font-mono text-slate-500">
              mycard.to/{username}
            </p>
          )}

          {data.bio && (
            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              {data.bio}
            </p>
          )}

          {data.email && (
            <p className="mt-3 text-xs sm:text-sm">
              <a
                href={`mailto:${data.email}`}
                className="text-pink-600 hover:text-pink-700 hover:underline break-all"
              >
                ✉ {data.email}
              </a>
            </p>
          )}

          {data.location && (
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              📍 {data.location}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
