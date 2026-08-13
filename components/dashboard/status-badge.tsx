import { STATUS_ENVIO, type StatusEnvio } from "@/config/dashboard"
import { cn } from "@/lib/utils"

const toneClass: Record<string, string> = {
  success: "bg-status-success-bg text-status-success",
  error: "bg-status-error-bg text-status-error",
  neutral: "bg-status-neutral-bg text-status-neutral",
}

export function StatusBadge({ status }: { status: StatusEnvio }) {
  const meta = STATUS_ENVIO[status]
  if (!meta) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        {status}
      </span>
    )
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[meta.tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  )
}
