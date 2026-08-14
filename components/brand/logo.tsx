import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative size-11 shrink-0 overflow-hidden rounded-full shadow-sm", className)}
      aria-hidden="true"
    >
      <Image src="/brand/lavateria-fast.png" alt="" fill sizes="44px" className="object-cover" priority />
    </div>
  )
}
