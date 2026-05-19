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
// Field order (per Fizz, 2026-05-18):
//   1. Photo
//   2. Display name (or @username)
//   3. Shop URL — Amazon storefront if set, otherwise mycard.to/<username>
//   4. Creator Star Level emblem
//   5. Bio
//   6. Location
export default function ProfileCard({ username, data }: Props) {
  const displayName = data.name || `@${username}`;
  const initial = (data.name?.[0] ?? username[0] ?? "?").toUpperCase();

  return (
    <header className="mx-auto max-w-md text-center">
      <div className="relative mx-auto h-28 w-28 rounded-full overflow-hidden bg-pink-100 flex items-center justify-center text-4xl font-bold text-pink-600 ring-4 ring-white shadow-sm">
        {data.photo_url ? (
          <Image
            src={data.photo_url}
            alt={displayName}
            fill
            sizes="112px"
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          initial
        )}
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {displayName}
      </h1>

      {data.amazon_storefront ? (
        <a
          href={data.amazon_storefront}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm font-mono text-pink-600 hover:text-pink-700 hover:underline"
        >
          {prettifyUrl(data.amazon_storefront)}
        </a>
      ) : (
        <p className="mt-1 text-sm font-mono text-slate-500">
          mycard.to/{username}
        </p>
      )}

      {data.star_level && (
        <div className="mt-5 inline-flex flex-col items-center">
          <StarEmblem level={data.star_level} size={72} />
          <span className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700">
            {LEVEL_LABELS[data.star_level]} Creator
          </span>
        </div>
      )}

      {data.bio && (
        <p className="mt-5 mx-auto max-w-md text-base text-slate-700 leading-relaxed">
          {data.bio}
        </p>
      )}

      {data.location && (
        <p className="mt-4 text-sm text-slate-600">
          {data.location}
        </p>
      )}
    </header>
  );
}
