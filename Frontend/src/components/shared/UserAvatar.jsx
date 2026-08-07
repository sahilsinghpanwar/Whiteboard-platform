import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorForUser, initials } from "@/lib/helpers";

export default function UserAvatar({ user, size = 32, className = "" }) {
  if (!user) return null;
  const id = user._id || user.userId || user.id;
  const name = user.fullName || user.name || "User";
  const src = user.profileImageUrl || user.avatar;
  const bg = colorForUser(id);
  const s = { width: size, height: size };
  return (
    <Avatar className={className} style={s}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback style={{ background: bg, color: "#fff", fontSize: Math.max(10, size / 2.6) }}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
