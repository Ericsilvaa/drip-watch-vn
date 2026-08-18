import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative size-11 shrink-0 overflow-hidden rounded-full shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src="/brand/lavateria-fast.png"
        alt="Lavateria Fast"
        fill
        sizes="44px"
        className="object-cover"
        priority
      />
    </div>
  )
}
