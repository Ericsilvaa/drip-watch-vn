import { Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <Droplets className="size-6" strokeWidth={2.2} />
    </div>
  )
}
