import { SectionCard } from "@/components/dashboard/section-card"
import { WhatsappUnidadeRow } from "@/components/configuracoes/whatsapp-unidade-row"
import { UNIDADES } from "@/config/dashboard"
import { WHATSAPP_INSTANCIAS, type WhatsappUnidadeSlug } from "@/config/integracao"

const UNIDADES_WHATSAPP = (Object.keys(WHATSAPP_INSTANCIAS) as WhatsappUnidadeSlug[]).map((slug) => {
  const unidade = UNIDADES.find((u) => u.slug === slug)!
  return { slug, nomeCurto: unidade.nomeCurto }
})

/**
 * Uma integração só, "Lavateria Fast": as duas unidades compartilham o mesmo
 * número de WhatsApp (ver decisão registrada), então em vez de dois cards
 * redundantes, um card com uma linha de conexão por unidade.
 */
export function WhatsappIntegracaoCard() {
  return (
    <SectionCard title="Lavateria Fast" description="Integração WhatsApp — mesmo número para as duas unidades">
      <div className="flex flex-col divide-y divide-border">
        {UNIDADES_WHATSAPP.map((u) => (
          <WhatsappUnidadeRow key={u.slug} unidadeSlug={u.slug} unidadeNomeCurto={u.nomeCurto} />
        ))}
      </div>
    </SectionCard>
  )
}
