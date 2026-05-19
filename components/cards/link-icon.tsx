// Wrapper that routes to PlatformIcon or SocialIcon based on the link's type.

import PlatformIcon from "./platform-icon";
import SocialIcon from "./social-icon";
import { isPlatformType, type LinkType } from "@/lib/links";

type Props = {
  type: LinkType;
  size?: number;
  className?: string;
};

export default function LinkIcon({ type, size, className }: Props) {
  if (isPlatformType(type)) {
    return <PlatformIcon platform={type} size={size} className={className} />;
  }
  return <SocialIcon type={type} size={size} className={className} />;
}
