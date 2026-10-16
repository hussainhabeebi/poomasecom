/* eslint-disable @next/next/no-img-element */

interface Props {
  emoji: string;
  tint: string;
  image?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Overrides the emoji size, e.g. "text-5xl". */
  emojiClassName?: string;
}

/** Product imagery: a real photo when provided, otherwise a branded tile. */
export function ProductVisual({ emoji, tint, image, name, size = "md", className = "", emojiClassName }: Props) {
  const text = emojiClassName ?? (size === "lg" ? "text-[9rem]" : size === "sm" ? "text-3xl" : "text-7xl");
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${tint} ${className}`}
    >
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
          <span role="img" aria-label={name} className={`relative drop-shadow-[0_12px_18px_rgba(0,0,0,0.18)] ${text}`}>
            {emoji}
          </span>
        </>
      )}
    </div>
  );
}
