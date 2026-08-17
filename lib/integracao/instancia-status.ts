import { WHATSAPP_INSTANCIA } from "@/config/integracao"

/**
 * Checagem server-side de conexão da instância WhatsApp, direto na
 * Evolution API — mesma lógica de app/api/integracao/whatsapp/status,
 * mas reutilizável como função (não uma Response). Usada pra validar no
 * servidor, não só no client (components/configuracoes/lembrete-form.tsx
 * e lembrete-linha.tsx já bloqueiam no client, mas isso é só UX — quem
 * chama a API direto, sem passar pelo formulário, não tinha essa
 * checagem antes).
 */
export async function instanciaWhatsappConectada(): Promise<boolean> {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  if (!apiUrl || !apiKey) return false

  try {
    const resposta = await fetch(`${apiUrl}/instance/connectionState/${WHATSAPP_INSTANCIA}`, {
      headers: { apikey: apiKey },
      cache: "no-store",
    })
    if (resposta.status === 404) return false
    if (!resposta.ok) return false
    const data = await resposta.json().catch(() => null)
    const state: string = data?.instance?.state ?? data?.state ?? "unknown"
    return state === "open"
  } catch {
    return false
  }
}
